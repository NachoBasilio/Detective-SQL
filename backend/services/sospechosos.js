'use strict';

/** Declaraciones y contradicciones de un sospechoso; null si no existe. */
function listarInterrogatorios(baseDeDatos, sospechosoId) {
  const existeSospechoso = baseDeDatos.prepare('SELECT 1 FROM sospechoso WHERE id = ?').get(sospechosoId) !== undefined;
  if (!existeSospechoso) return null;

  return baseDeDatos
    .prepare(
      `SELECT id, fecha_hora AS fechaHora, declaracion, contradiccion_detectada AS contradiccion
       FROM interrogatorio
       WHERE sospechoso_id = ?
       ORDER BY fecha_hora, id`,
    )
    .all(sospechosoId);
}

module.exports = { listarInterrogatorios };
