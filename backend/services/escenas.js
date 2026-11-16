'use strict';

/**
 * Evidencias encontradas en una escena, cada una con el lugar que acredita
 * (null si no acredita ninguno) y sus vínculos a sospechosos. Devuelve null
 * cuando la escena no existe.
 */
function listarEvidencias(baseDeDatos, escenaId) {
  const existeEscena = baseDeDatos.prepare('SELECT 1 FROM escena WHERE id = ?').get(escenaId) !== undefined;
  if (!existeEscena) return null;

  const evidencias = baseDeDatos
    .prepare(
      `SELECT ev.id, ev.tipo, ev.descripcion, ev.relevancia, ev.hora_indicio AS horaIndicio,
              l.nombre AS lugarAcreditado
       FROM evidencia ev
       LEFT JOIN lugar l ON l.id = ev.lugar_acreditado_id
       WHERE ev.escena_id = ?
       ORDER BY ev.id`,
    )
    .all(escenaId);
  const vinculos = baseDeDatos
    .prepare(
      `SELECT se.evidencia_id AS evidenciaId, s.id AS sospechosoId, s.nombre,
              se.tipo_vinculo AS tipoVinculo, se.peso, se.observaciones
       FROM sospechoso_evidencia se
       JOIN evidencia ev ON ev.id = se.evidencia_id
       JOIN sospechoso s ON s.id = se.sospechoso_id
       WHERE ev.escena_id = ?
       ORDER BY se.evidencia_id, s.id`,
    )
    .all(escenaId);

  return evidencias.map((evidencia) => ({
    ...evidencia,
    vinculos: vinculos
      .filter((vinculo) => vinculo.evidenciaId === evidencia.id)
      .map(({ evidenciaId, ...vinculo }) => vinculo),
  }));
}

module.exports = { listarEvidencias };
