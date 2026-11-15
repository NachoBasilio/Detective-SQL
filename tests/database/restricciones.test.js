'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { afirmarRechazoSinCambios, contarFilasPorTabla, insertarEvidencia } = require('../helpers/base-de-datos');

const ID_CASO = 1;
const ID_ELISA = 1;
const ID_BRUNO = 2;
const ID_CARLA = 3;
const ID_DIEGO = 4;
const ID_PARTIDA_DEMO = 1;
const ID_RESTAURANTE = 6;
const PARTIDA_FINALIZADA = 'Una partida finalizada no puede modificarse ni reabrirse';

// Se compara el mensaje y no el código: SQLite informa ON DELETE RESTRICT con
// el código extendido SQLITE_CONSTRAINT_TRIGGER, pero con el mismo mensaje.
const ERROR_CLAVE_FORANEA = { message: 'FOREIGN KEY constraint failed' };
const ERROR_CHECK = { code: 'SQLITE_CONSTRAINT_CHECK' };

function errorDeTrigger(mensaje) {
  return { code: 'SQLITE_CONSTRAINT_TRIGGER', message: mensaje };
}

function iniciarPartida(conexion) {
  return Number(conexion.prepare('INSERT INTO partida (caso_id) VALUES (?)').run(ID_CASO).lastInsertRowid);
}

function acusar(conexion, partidaId, sospechosoId) {
  return conexion
    .prepare('INSERT INTO acusacion (partida_id, sospechoso_id) VALUES (?, ?)')
    .run(partidaId, sospechosoId);
}

function cerrarPartida(conexion, partidaId, estado) {
  return conexion.prepare('UPDATE partida SET estado = ? WHERE id = ?').run(estado, partidaId);
}

function estadoDePartida(conexion, partidaId) {
  return conexion.prepare('SELECT estado FROM partida WHERE id = ?').pluck().get(partidaId);
}

function acusadoEn(conexion, partidaId) {
  return conexion.prepare('SELECT sospechoso_id FROM acusacion WHERE partida_id = ?').pluck().get(partidaId);
}

function lugarAcreditadoDe(conexion, evidenciaId) {
  return conexion.prepare('SELECT lugar_acreditado_id FROM evidencia WHERE id = ?').pluck().get(evidenciaId);
}

describe('Claves foráneas', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('impiden crear una escena en un lugar inexistente', () => {
    afirmarRechazoSinCambios(
      conexion,
      () =>
        conexion
          .prepare('INSERT INTO escena (caso_id, lugar_id, hora_suceso, es_principal) VALUES (?, ?, ?, ?)')
          .run(ID_CASO, 999, '2026-11-09 21:00:00', 0),
      ERROR_CLAVE_FORANEA,
    );
  });

  test('impiden declarar una coartada en un lugar inexistente', () => {
    afirmarRechazoSinCambios(
      conexion,
      () =>
        conexion
          .prepare(
            `INSERT INTO sospechoso
             (caso_id, nombre, coartada, lugar_coartada_id, coartada_desde, coartada_hasta, relacion_victima)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(ID_CASO, 'Nadia Paz', 'Afirmo que estuvo en el cine.', 999,
            '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Vecina de la victima'),
      ERROR_CLAVE_FORANEA,
    );
  });

  test('impiden borrar un lugar usado por una escena', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('DELETE FROM lugar WHERE nombre = ?').run('Archivo municipal'),
      ERROR_CLAVE_FORANEA,
    );
  });

  test('impiden acusar a un sospechoso inexistente', () => {
    const partidaId = iniciarPartida(conexion);
    afirmarRechazoSinCambios(conexion, () => acusar(conexion, partidaId, 999), ERROR_CLAVE_FORANEA);
  });

  test('impiden acreditar una evidencia en un lugar inexistente', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => insertarEvidencia(conexion, { escenaId: 1, horaIndicio: '2026-11-09 21:00:00', lugarAcreditadoId: 999 }),
      ERROR_CLAVE_FORANEA,
    );
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('UPDATE evidencia SET lugar_acreditado_id = ? WHERE id = ?').run(999, 18),
      ERROR_CLAVE_FORANEA,
    );
    assert.equal(lugarAcreditadoDe(conexion, 18), ID_RESTAURANTE);
  });

  test('permiten una evidencia sin lugar acreditado', () => {
    const evidenciaId = insertarEvidencia(conexion, { escenaId: 1, tipo: 'objeto', lugarAcreditadoId: null });
    assert.equal(lugarAcreditadoDe(conexion, evidenciaId), null);
  });

  test('impiden borrar un lugar acreditado por una evidencia', () => {
    const lugarId = Number(
      conexion.prepare('INSERT INTO lugar (nombre, tipo_lugar) VALUES (?, ?)').run('Plaza Mayor', 'plaza').lastInsertRowid,
    );
    const evidenciaId = insertarEvidencia(conexion, { escenaId: 1, horaIndicio: '2026-11-09 21:00:00', lugarAcreditadoId: lugarId });

    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('DELETE FROM lugar WHERE id = ?').run(lugarId),
      ERROR_CLAVE_FORANEA,
    );
    assert.equal(lugarAcreditadoDe(conexion, evidenciaId), lugarId);
  });

  test('propagan a las evidencias el cambio de id del lugar acreditado', () => {
    conexion.prepare('UPDATE lugar SET id = ? WHERE id = ?').run(60, ID_RESTAURANTE);
    assert.equal(lugarAcreditadoDe(conexion, 18), 60);
    assert.deepEqual(conexion.pragma('foreign_key_check'), []);
  });
});

describe('Restricciones CHECK', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  for (const relevancia of [0, 6]) {
    test(`rechazan una evidencia con relevancia ${relevancia}`, () => {
      afirmarRechazoSinCambios(
        conexion,
        () =>
          conexion
            .prepare('INSERT INTO evidencia (escena_id, tipo, descripcion, relevancia) VALUES (?, ?, ?, ?)')
            .run(1, 'objeto', 'Llave sin identificar.', relevancia),
        ERROR_CHECK,
      );
    });
  }

  test('rechazan un estado de caso inválido', () => {
    afirmarRechazoSinCambios(
      conexion,
      () =>
        conexion
          .prepare('INSERT INTO caso (titulo, descripcion, fecha_apertura, estado) VALUES (?, ?, ?, ?)')
          .run('Caso de prueba', 'Descripcion de prueba.', '2026-11-15', 'cerrado'),
      ERROR_CHECK,
    );
  });

  test('rechazan un estado de partida inválido', () => {
    const partidaId = iniciarPartida(conexion);
    afirmarRechazoSinCambios(conexion, () => cerrarPartida(conexion, partidaId, 'abandonada'), ERROR_CHECK);
    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
  });

  test('rechazan un tipo de vínculo inválido', () => {
    afirmarRechazoSinCambios(
      conexion,
      () =>
        conexion
          .prepare(
            `INSERT INTO sospechoso_evidencia (sospechoso_id, evidencia_id, tipo_vinculo, peso, observaciones)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(ID_ELISA, 9, 'sospecha', 2, 'Vinculo de prueba.'),
      ERROR_CHECK,
    );
  });
});

describe('Arrestos y partidas', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('INSERT de una acusación correcta cierra automáticamente la partida como ganada', () => {
    const partidaId = iniciarPartida(conexion);
    acusar(conexion, partidaId, ID_CARLA);
    assert.equal(estadoDePartida(conexion, partidaId), 'ganada');
  });

  test('INSERT de una acusación incorrecta cierra automáticamente la partida como perdida', () => {
    for (const inocente of [ID_ELISA, ID_BRUNO, ID_DIEGO]) {
      const partidaId = iniciarPartida(conexion);
      acusar(conexion, partidaId, inocente);
      assert.equal(estadoDePartida(conexion, partidaId), 'perdida', `acusado ${inocente}`);
    }
  });

  test('no se pueden registrar dos arrestos en la misma partida', () => {
    const partidaId = iniciarPartida(conexion);
    acusar(conexion, partidaId, ID_ELISA);
    // La primera acusación ya cerró la partida: el trigger rechaza la segunda
    // antes de llegar al UNIQUE de acusacion.partida_id.
    afirmarRechazoSinCambios(
      conexion,
      () => acusar(conexion, partidaId, ID_CARLA),
      errorDeTrigger('No se puede acusar en una partida terminada'),
    );
    assert.equal(estadoDePartida(conexion, partidaId), 'perdida');
    assert.equal(acusadoEn(conexion, partidaId), ID_ELISA);
  });

  test('una partida finalizada no puede reabrirse', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, ID_PARTIDA_DEMO, 'en_curso'),
      errorDeTrigger(PARTIDA_FINALIZADA),
    );
    assert.equal(estadoDePartida(conexion, ID_PARTIDA_DEMO), 'perdida');
  });

  test('una partida finalizada no admite cambios en sus datos históricos', () => {
    const fechaInicio = conexion.prepare('SELECT fecha_inicio FROM partida WHERE id = ?').pluck().get(ID_PARTIDA_DEMO);
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('UPDATE partida SET fecha_inicio = ? WHERE id = ?').run('2000-01-01 00:00:00', ID_PARTIDA_DEMO),
      errorDeTrigger(PARTIDA_FINALIZADA),
    );
    assert.equal(conexion.prepare('SELECT fecha_inicio FROM partida WHERE id = ?').pluck().get(ID_PARTIDA_DEMO), fechaInicio);
  });

  test('una acusación fallida no modifica el estado de la partida', () => {
    const partidaId = iniciarPartida(conexion);
    afirmarRechazoSinCambios(conexion, () => acusar(conexion, partidaId, 999), ERROR_CLAVE_FORANEA);
    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
  });

  test('si falla el cierre automático, la sentencia INSERT se revierte completa', () => {
    const partidaId = iniciarPartida(conexion);
    conexion.exec(`
      CREATE TEMP TRIGGER forzar_falla_al_cerrar_partida
      BEFORE UPDATE OF estado ON partida
      BEGIN
          SELECT RAISE(ABORT, 'falla forzada al cerrar la partida');
      END;
    `);
    afirmarRechazoSinCambios(
      conexion,
      () => acusar(conexion, partidaId, ID_CARLA),
      errorDeTrigger('falla forzada al cerrar la partida'),
    );
    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
    assert.equal(acusadoEn(conexion, partidaId), undefined);
  });

  test('un ROLLBACK revierte la acusación y el cierre automático de la partida', () => {
    const partidaId = iniciarPartida(conexion);
    const filasAntes = contarFilasPorTabla(conexion);

    conexion.exec('BEGIN');
    acusar(conexion, partidaId, ID_CARLA);
    assert.equal(estadoDePartida(conexion, partidaId), 'ganada');
    conexion.exec('ROLLBACK');

    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
    assert.equal(acusadoEn(conexion, partidaId), undefined);
    assert.deepEqual(contarFilasPorTabla(conexion), filasAntes);
  });

  test('no queda ninguna partida en curso con una acusación confirmada', () => {
    acusar(conexion, iniciarPartida(conexion), ID_CARLA);
    acusar(conexion, iniciarPartida(conexion), ID_BRUNO);
    iniciarPartida(conexion);

    const partidasInconsistentes = conexion
      .prepare(
        `SELECT p.id
         FROM partida p
         JOIN acusacion a ON a.partida_id = p.id
         JOIN sospechoso s ON s.id = a.sospechoso_id
         WHERE p.estado <> CASE WHEN s.es_culpable = 1 THEN 'ganada' ELSE 'perdida' END`,
      )
      .all();
    assert.deepEqual(partidasInconsistentes, []);
    assert.equal(
      conexion.prepare("SELECT COUNT(*) FROM partida WHERE estado = 'en_curso' AND id NOT IN (SELECT partida_id FROM acusacion)").pluck().get(),
      1,
    );
  });

  test('las partidas independientes no se afectan entre sí', () => {
    const ganada = iniciarPartida(conexion);
    const perdida = iniciarPartida(conexion);
    const enCurso = iniciarPartida(conexion);

    acusar(conexion, ganada, ID_CARLA);
    assert.deepEqual([ganada, perdida, enCurso].map((id) => estadoDePartida(conexion, id)), ['ganada', 'en_curso', 'en_curso']);

    acusar(conexion, perdida, ID_DIEGO);
    assert.deepEqual([ganada, perdida, enCurso].map((id) => estadoDePartida(conexion, id)), ['ganada', 'perdida', 'en_curso']);
    assert.equal(estadoDePartida(conexion, ID_PARTIDA_DEMO), 'perdida');
  });

  test('una partida finalizada no admite un nuevo arresto', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => acusar(conexion, ID_PARTIDA_DEMO, ID_CARLA),
      errorDeTrigger('No se puede acusar en una partida terminada'),
    );
  });

  test('una partida no puede cerrarse sin acusación', () => {
    const partidaId = iniciarPartida(conexion);
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, partidaId, 'ganada'),
      errorDeTrigger('El resultado no coincide con la acusacion'),
    );
    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
  });

  test('el resultado lo calcula SQLite y no puede cambiarse después del arresto', () => {
    const partidaContraCarla = iniciarPartida(conexion);
    acusar(conexion, partidaContraCarla, ID_CARLA);
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, partidaContraCarla, 'perdida'),
      errorDeTrigger(PARTIDA_FINALIZADA),
    );
    assert.equal(estadoDePartida(conexion, partidaContraCarla), 'ganada');

    const partidaContraElisa = iniciarPartida(conexion);
    acusar(conexion, partidaContraElisa, ID_ELISA);
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, partidaContraElisa, 'ganada'),
      errorDeTrigger(PARTIDA_FINALIZADA),
    );
    assert.equal(estadoDePartida(conexion, partidaContraElisa), 'perdida');
  });

  test('una partida no puede comenzar finalizada', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('INSERT INTO partida (caso_id, estado) VALUES (?, ?)').run(ID_CASO, 'ganada'),
      errorDeTrigger('Las partidas deben comenzar en curso'),
    );
  });

  test('una acusación registrada no puede modificarse ni eliminarse', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('UPDATE acusacion SET sospechoso_id = ? WHERE partida_id = ?').run(ID_CARLA, ID_PARTIDA_DEMO),
      errorDeTrigger('Una acusacion registrada no puede modificarse'),
    );
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('DELETE FROM acusacion WHERE partida_id = ?').run(ID_PARTIDA_DEMO),
      errorDeTrigger('Una acusacion registrada no puede eliminarse'),
    );
  });
});

describe('Triggers entre casos', () => {
  let conexion;
  let sospechosoDeOtroCaso;
  beforeEach(() => {
    conexion = crearBase(':memory:');
    const otroCaso = conexion
      .prepare('INSERT INTO caso (titulo, descripcion, fecha_apertura) VALUES (?, ?, ?)')
      .run('Caso de control', 'Caso auxiliar para probar relaciones cruzadas.', '2026-11-15').lastInsertRowid;
    const lugar = conexion.prepare('SELECT id FROM lugar WHERE nombre = ?').pluck().get('Gimnasio Norte');
    sospechosoDeOtroCaso = Number(
      conexion
        .prepare(
          `INSERT INTO sospechoso
           (caso_id, nombre, coartada, lugar_coartada_id, coartada_desde, coartada_hasta, relacion_victima)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(otroCaso, 'Hugo Lima', 'Afirmo que estuvo entrenando.', lugar,
          '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Testigo').lastInsertRowid,
    );
  });
  afterEach(() => conexion.close());

  test('impiden vincular una evidencia con un sospechoso de otro caso', () => {
    afirmarRechazoSinCambios(
      conexion,
      () =>
        conexion
          .prepare(
            `INSERT INTO sospechoso_evidencia (sospechoso_id, evidencia_id, tipo_vinculo, peso, observaciones)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(sospechosoDeOtroCaso, 1, 'incrimina', 3, 'Vinculo cruzado de prueba.'),
      errorDeTrigger('La evidencia y el sospechoso deben pertenecer al mismo caso'),
    );
  });

  test('impiden acusar a un sospechoso de otro caso', () => {
    const partidaId = iniciarPartida(conexion);
    afirmarRechazoSinCambios(
      conexion,
      () => acusar(conexion, partidaId, sospechosoDeOtroCaso),
      errorDeTrigger('El sospechoso no pertenece al caso de la partida'),
    );
    assert.equal(estadoDePartida(conexion, partidaId), 'en_curso');
  });
});
