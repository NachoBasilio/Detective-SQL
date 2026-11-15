'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { afirmarRechazoSinCambios } = require('../helpers/base-de-datos');

const ID_CASO = 1;
const ID_ELISA = 1;
const ID_CARLA = 3;
const ID_PARTIDA_DEMO = 1;

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

  test('no se pueden registrar dos arrestos en la misma partida', () => {
    const partidaId = iniciarPartida(conexion);
    acusar(conexion, partidaId, ID_ELISA);
    afirmarRechazoSinCambios(conexion, () => acusar(conexion, partidaId, ID_CARLA), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });
  });

  test('una partida finalizada no puede reabrirse', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, ID_PARTIDA_DEMO, 'en_curso'),
      errorDeTrigger('Una partida finalizada no puede reabrirse'),
    );
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

  test('el resultado debe coincidir con la culpabilidad del acusado', () => {
    const partidaContraCarla = iniciarPartida(conexion);
    acusar(conexion, partidaContraCarla, ID_CARLA);
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, partidaContraCarla, 'perdida'),
      errorDeTrigger('El resultado no coincide con la acusacion'),
    );
    assert.equal(estadoDePartida(conexion, partidaContraCarla), 'en_curso');

    const partidaContraElisa = iniciarPartida(conexion);
    acusar(conexion, partidaContraElisa, ID_ELISA);
    afirmarRechazoSinCambios(
      conexion,
      () => cerrarPartida(conexion, partidaContraElisa, 'ganada'),
      errorDeTrigger('El resultado no coincide con la acusacion'),
    );
    assert.equal(estadoDePartida(conexion, partidaContraElisa), 'en_curso');
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
  });
});
