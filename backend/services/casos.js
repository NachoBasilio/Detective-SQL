'use strict';

// Consultas del expediente y de la investigación de un caso. Las funciones
// que reciben un casoId devuelven null cuando el caso no existe.
// Nunca se selecciona sospechoso.es_culpable.

function existeCaso(baseDeDatos, casoId) {
  return baseDeDatos.prepare('SELECT 1 FROM caso WHERE id = ?').get(casoId) !== undefined;
}

function listarCasos(baseDeDatos) {
  return baseDeDatos
    .prepare(
      `SELECT id, titulo, descripcion, fecha_apertura AS fechaApertura, estado
       FROM caso
       ORDER BY id`,
    )
    .all();
}

/** Datos públicos del caso; el lugar y la hora del crimen salen de la escena principal. */
function obtenerCaso(baseDeDatos, casoId) {
  const fila = baseDeDatos
    .prepare(
      `SELECT c.id, c.titulo, c.descripcion, c.fecha_apertura AS fechaApertura, c.estado,
              l.nombre AS lugar, l.tipo_lugar AS tipoLugar, ec.hora_suceso AS horaSuceso
       FROM caso c
       LEFT JOIN escena ec ON ec.caso_id = c.id AND ec.es_principal = 1
       LEFT JOIN lugar l ON l.id = ec.lugar_id
       WHERE c.id = ?`,
    )
    .get(casoId);
  if (fila === undefined) return null;

  const { lugar, tipoLugar, horaSuceso, ...caso } = fila;
  return { ...caso, escenaPrincipal: horaSuceso === null ? null : { lugar, tipoLugar, horaSuceso } };
}

function listarSospechosos(baseDeDatos, casoId) {
  if (!existeCaso(baseDeDatos, casoId)) return null;
  return baseDeDatos
    .prepare(
      `SELECT s.id, s.nombre, s.relacion_victima AS relacionVictima, s.coartada,
              l.nombre AS lugarCoartada, s.coartada_desde AS coartadaDesde, s.coartada_hasta AS coartadaHasta
       FROM sospechoso s
       JOIN lugar l ON l.id = s.lugar_coartada_id
       WHERE s.caso_id = ?
       ORDER BY s.id`,
    )
    .all(casoId);
}

function listarEscenas(baseDeDatos, casoId) {
  if (!existeCaso(baseDeDatos, casoId)) return null;
  return baseDeDatos
    .prepare(
      `SELECT ec.id, l.nombre AS lugar, l.tipo_lugar AS tipoLugar, ec.hora_suceso AS horaSuceso,
              ec.es_principal AS esPrincipal, COUNT(ev.id) AS cantidadEvidencias
       FROM escena ec
       JOIN lugar l ON l.id = ec.lugar_id
       LEFT JOIN evidencia ev ON ev.escena_id = ec.id
       WHERE ec.caso_id = ?
       GROUP BY ec.id, l.nombre, l.tipo_lugar, ec.hora_suceso, ec.es_principal
       ORDER BY ec.id`,
    )
    .all(casoId)
    .map((escena) => ({ ...escena, esPrincipal: escena.esPrincipal === 1 }));
}

/**
 * Consulta C1 del script filtrada por caso: evidencias con hora que acreditan
 * a un sospechoso en un lugar distinto del declarado dentro de su coartada.
 * lugarObservado es el lugar acreditado por la evidencia, no el de la escena
 * donde se encontró; sin lugar acreditado no hay contradicción.
 */
function descartarCoartadas(baseDeDatos, casoId) {
  if (!existeCaso(baseDeDatos, casoId)) return null;
  return baseDeDatos
    .prepare(
      `SELECT s.id AS sospechosoId, s.nombre,
              lugar_declarado.nombre AS lugarDeclarado,
              lugar_observado.nombre AS lugarObservado,
              ev.hora_indicio AS horaIndicio, ev.id AS evidenciaId
       FROM sospechoso s
       JOIN lugar lugar_declarado ON lugar_declarado.id = s.lugar_coartada_id
       JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
       JOIN evidencia ev ON ev.id = se.evidencia_id
       JOIN lugar lugar_observado ON lugar_observado.id = ev.lugar_acreditado_id
       WHERE s.caso_id = ?
         AND ev.hora_indicio IS NOT NULL
         AND ev.hora_indicio BETWEEN s.coartada_desde AND s.coartada_hasta
         AND ev.lugar_acreditado_id <> s.lugar_coartada_id
       ORDER BY s.id, ev.hora_indicio, ev.id`,
    )
    .all(casoId);
}

/** Matriz de evidencias leída de la vista vista_matriz_evidencias. */
function obtenerMatriz(baseDeDatos, casoId) {
  if (!existeCaso(baseDeDatos, casoId)) return null;
  return baseDeDatos
    .prepare(
      `SELECT sospechoso_id AS sospechosoId, nombre,
              cantidad_incriminatorias AS cantidadIncriminatorias,
              peso_incriminatorio AS pesoIncriminatorio,
              cantidad_presencias AS cantidadPresencias,
              peso_exculpatorio AS pesoExculpatorio
       FROM vista_matriz_evidencias
       WHERE caso_id = ?
       ORDER BY sospechoso_id`,
    )
    .all(casoId);
}

module.exports = {
  listarCasos,
  obtenerCaso,
  listarSospechosos,
  listarEscenas,
  descartarCoartadas,
  obtenerMatriz,
};
