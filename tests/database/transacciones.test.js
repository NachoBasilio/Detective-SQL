'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { afirmarRechazoSinCambios, contarFilasPorTabla } = require('../helpers/base-de-datos');

const ID_CASO = 1;
const ID_CARLA = 3;
const ID_DIEGO = 4;

describe('Transacciones de demostración del script', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('el COMMIT deja una única partida perdida por acusar a un inocente', () => {
    const partidas = conexion.prepare('SELECT id, caso_id, estado FROM partida').all();
    assert.deepEqual(partidas, [{ id: 1, caso_id: ID_CASO, estado: 'perdida' }]);

    const acusaciones = conexion.prepare('SELECT partida_id, sospechoso_id FROM acusacion').all();
    assert.deepEqual(acusaciones, [{ partida_id: 1, sospechoso_id: ID_DIEGO }]);
  });

  test('el caso sigue abierto después de la demostración', () => {
    assert.equal(conexion.prepare('SELECT estado FROM caso WHERE id = ?').pluck().get(ID_CASO), 'abierto');
  });

  test('el ROLLBACK no deja filas de la partida descartada', () => {
    const filas = contarFilasPorTabla(conexion);
    assert.equal(filas.partida, 1);
    assert.equal(filas.acusacion, 1);
  });
});

describe('Transacción de arresto desde la aplicación', () => {
  let conexion;
  let arrestar;
  beforeEach(() => {
    conexion = crearBase(':memory:');
    // Acción del juego: abrir partida, registrar la acusación y cerrar la
    // partida con el resultado declarado, todo o nada.
    arrestar = conexion.transaction((sospechosoId, resultado) => {
      const partidaId = conexion.prepare('INSERT INTO partida (caso_id) VALUES (?)').run(ID_CASO).lastInsertRowid;
      conexion
        .prepare('INSERT INTO acusacion (partida_id, sospechoso_id) VALUES (?, ?)')
        .run(partidaId, sospechosoId);
      conexion.prepare('UPDATE partida SET estado = ? WHERE id = ?').run(resultado, partidaId);
      return Number(partidaId);
    });
  });
  afterEach(() => conexion.close());

  test('una transacción fallida hace ROLLBACK completo y no deja filas parciales', () => {
    afirmarRechazoSinCambios(conexion, () => arrestar(ID_CARLA, 'perdida'), {
      code: 'SQLITE_CONSTRAINT_TRIGGER',
      message: 'El resultado no coincide con la acusacion',
    });
    assert.equal(conexion.inTransaction, false);
  });

  test('la base sigue jugable: se puede crear una partida y ganar arrestando a la culpable', () => {
    const partidaId = arrestar(ID_CARLA, 'ganada');

    assert.equal(conexion.prepare('SELECT estado FROM partida WHERE id = ?').pluck().get(partidaId), 'ganada');
    assert.equal(
      conexion.prepare('SELECT sospechoso_id FROM acusacion WHERE partida_id = ?').pluck().get(partidaId),
      ID_CARLA,
    );
    const filas = contarFilasPorTabla(conexion);
    assert.equal(filas.partida, 2);
    assert.equal(filas.acusacion, 2);
  });
});
