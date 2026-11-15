'use strict';

// Partidas y arrestos. Las reglas del juego (una sola acusación por partida,
// sospechoso del mismo caso, partida en curso) las imponen los triggers, la
// clave UNIQUE y las claves foráneas de SQLite: acá no se revalidan, y sus
// errores llegan al controlador.

function obtenerPartida(baseDeDatos, partidaId) {
  const partida = baseDeDatos
    .prepare('SELECT id, caso_id AS casoId, estado, fecha_inicio AS fechaInicio FROM partida WHERE id = ?')
    .get(partidaId);
  return partida ?? null;
}

function crearPartida(baseDeDatos, casoId) {
  const { lastInsertRowid } = baseDeDatos.prepare('INSERT INTO partida (caso_id) VALUES (?)').run(casoId);
  return obtenerPartida(baseDeDatos, Number(lastInsertRowid));
}

/**
 * Registra el arresto en una única transacción: inserta la acusación, lee en
 * SQLite si el acusado es culpable y cierra la partida como ganada o perdida.
 * Si cualquier sentencia falla, better-sqlite3 hace ROLLBACK de todo.
 * Devuelve null cuando la partida no existe.
 */
function registrarArresto(baseDeDatos, partidaId, sospechosoId) {
  const arrestar = baseDeDatos.transaction(() => {
    if (obtenerPartida(baseDeDatos, partidaId) === null) return null;

    const { lastInsertRowid } = baseDeDatos
      .prepare('INSERT INTO acusacion (partida_id, sospechoso_id) VALUES (?, ?)')
      .run(partidaId, sospechosoId);
    const acusacionId = Number(lastInsertRowid);

    const acusadoEsCulpable =
      baseDeDatos
        .prepare(
          `SELECT s.es_culpable
           FROM acusacion a
           JOIN sospechoso s ON s.id = a.sospechoso_id
           WHERE a.id = ?`,
        )
        .pluck()
        .get(acusacionId) === 1;

    baseDeDatos
      .prepare('UPDATE partida SET estado = ? WHERE id = ?')
      .run(acusadoEsCulpable ? 'ganada' : 'perdida', partidaId);

    const partida = baseDeDatos.prepare('SELECT id, caso_id AS casoId, estado FROM partida WHERE id = ?').get(partidaId);
    const acusacion = baseDeDatos
      .prepare(
        `SELECT a.id, a.sospechoso_id AS sospechosoId, s.nombre, a.fecha_acusacion AS fechaAcusacion
         FROM acusacion a
         JOIN sospechoso s ON s.id = a.sospechoso_id
         WHERE a.id = ?`,
      )
      .get(acusacionId);
    // Recién después del arresto se revela quién era el culpable del caso.
    const culpable = baseDeDatos
      .prepare('SELECT id, nombre FROM sospechoso WHERE caso_id = ? AND es_culpable = 1')
      .get(partida.casoId);

    return {
      partida,
      acusacion,
      resultado: acusadoEsCulpable ? 'correcto' : 'incorrecto',
      culpable: culpable ?? null,
    };
  });

  return arrestar();
}

module.exports = { obtenerPartida, crearPartida, registrarArresto };
