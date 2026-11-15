'use strict';

/**
 * Evidencias encontradas en una escena, cada una con sus vínculos a
 * sospechosos. Devuelve null cuando la escena no existe.
 */
function listarEvidencias(baseDeDatos, escenaId) {
  const existeEscena = baseDeDatos.prepare('SELECT 1 FROM escena WHERE id = ?').get(escenaId) !== undefined;
  if (!existeEscena) return null;

  const evidencias = baseDeDatos
    .prepare(
      `SELECT id, tipo, descripcion, relevancia, hora_indicio AS horaIndicio
       FROM evidencia
       WHERE escena_id = ?
       ORDER BY id`,
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
