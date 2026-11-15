'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { TABLAS_DEL_MODELO, contarFilasPorTabla } = require('../helpers/base-de-datos');

function columnasDe(conexion, tabla) {
  return conexion.pragma(`table_info(${tabla})`).map((columna) => columna.name);
}

function claveForaneaDe(conexion, tabla, columna) {
  return conexion.pragma(`foreign_key_list(${tabla})`).find((clave) => clave.from === columna);
}

describe('Esquema creado por database/detective.sql', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('se crean exactamente las nueve tablas del modelo', () => {
    const tablas = conexion
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .pluck()
      .all();
    assert.deepEqual(tablas, TABLAS_DEL_MODELO);
  });

  test('las claves foráneas quedan activas en la conexión', () => {
    assert.equal(conexion.pragma('foreign_keys', { simple: true }), 1);
  });

  test('lugar guarda nombre y tipo de lugar', () => {
    assert.deepEqual(columnasDe(conexion, 'lugar'), ['id', 'nombre', 'tipo_lugar']);
  });

  test('escena referencia lugar por identificador en lugar de texto libre', () => {
    const columnas = columnasDe(conexion, 'escena');
    assert.ok(columnas.includes('lugar_id'));
    assert.ok(!columnas.includes('ubicacion'));
    assert.ok(!columnas.includes('tipo_lugar'));

    const clave = claveForaneaDe(conexion, 'escena', 'lugar_id');
    assert.equal(clave.table, 'lugar');
    assert.equal(clave.on_delete, 'RESTRICT');
    assert.equal(clave.on_update, 'CASCADE');
  });

  test('sospechoso referencia el lugar de su coartada por identificador', () => {
    const columnas = columnasDe(conexion, 'sospechoso');
    assert.ok(columnas.includes('lugar_coartada_id'));
    assert.ok(!columnas.includes('ubicacion_declarada'));

    const clave = claveForaneaDe(conexion, 'sospechoso', 'lugar_coartada_id');
    assert.equal(clave.table, 'lugar');
    assert.equal(clave.on_delete, 'RESTRICT');
    assert.equal(clave.on_update, 'CASCADE');
  });

  test('las nuevas claves foráneas tienen índice', () => {
    const indicesEscena = conexion.pragma('index_list(escena)').map((indice) => indice.name);
    const indicesSospechoso = conexion.pragma('index_list(sospechoso)').map((indice) => indice.name);
    const columnasIndexadas = (nombres) =>
      nombres.flatMap((nombre) => conexion.pragma(`index_info(${nombre})`).map((columna) => columna.name));

    assert.ok(columnasIndexadas(indicesEscena).includes('lugar_id'));
    assert.ok(columnasIndexadas(indicesSospechoso).includes('lugar_coartada_id'));
  });

  test('partida no guarda fecha_fin: la fecha sale de la acusación', () => {
    assert.ok(!columnasDe(conexion, 'partida').includes('fecha_fin'));
    assert.ok(columnasDe(conexion, 'acusacion').includes('fecha_acusacion'));
  });
});

describe('Datos semilla', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('se cargan los datos mínimos del proyecto', () => {
    const filas = contarFilasPorTabla(conexion);
    assert.equal(filas.caso, 1);
    assert.equal(filas.sospechoso, 4);
    assert.equal(filas.escena, 3);
    assert.ok(filas.evidencia >= 8, `hay ${filas.evidencia} evidencias`);
  });

  test('cada lugar tiene un único tipo', () => {
    const lugares = conexion.prepare('SELECT nombre, tipo_lugar FROM lugar ORDER BY id').all();
    assert.deepEqual(lugares, [
      { nombre: 'Archivo municipal', tipo_lugar: 'oficina' },
      { nombre: 'Estacionamiento municipal', tipo_lugar: 'estacionamiento' },
      { nombre: 'Cafe Bahia', tipo_lugar: 'cafeteria' },
      { nombre: 'Hospital Central', tipo_lugar: 'hospital' },
      { nombre: 'Domicilio de Bruno', tipo_lugar: 'vivienda' },
      { nombre: 'Restaurante Central', tipo_lugar: 'restaurante' },
      { nombre: 'Gimnasio Norte', tipo_lugar: 'gimnasio' },
    ]);
  });

  test('escenas y coartadas apuntan a los lugares del caso', () => {
    const escenas = conexion
      .prepare('SELECT ec.id, l.nombre FROM escena ec JOIN lugar l ON l.id = ec.lugar_id ORDER BY ec.id')
      .all();
    assert.deepEqual(escenas, [
      { id: 1, nombre: 'Archivo municipal' },
      { id: 2, nombre: 'Estacionamiento municipal' },
      { id: 3, nombre: 'Cafe Bahia' },
    ]);

    const coartadas = conexion
      .prepare('SELECT s.nombre, l.nombre AS lugar FROM sospechoso s JOIN lugar l ON l.id = s.lugar_coartada_id ORDER BY s.id')
      .all();
    assert.deepEqual(coartadas, [
      { nombre: 'Elisa Rivas', lugar: 'Hospital Central' },
      { nombre: 'Bruno Torres', lugar: 'Domicilio de Bruno' },
      { nombre: 'Carla Mendez', lugar: 'Restaurante Central' },
      { nombre: 'Diego Salas', lugar: 'Gimnasio Norte' },
    ]);
  });

  test('existe exactamente un culpable por caso', () => {
    const culpables = conexion
      .prepare('SELECT caso_id, COUNT(*) AS total FROM sospechoso WHERE es_culpable = 1 GROUP BY caso_id')
      .all();
    assert.deepEqual(culpables, [{ caso_id: 1, total: 1 }]);
  });

  test('un inocente acumula pruebas incriminatorias y tiene una exculpatoria', () => {
    const vinculosDeBruno = conexion
      .prepare(
        `SELECT se.tipo_vinculo, SUM(se.peso) AS peso
         FROM sospechoso_evidencia se
         JOIN sospechoso s ON s.id = se.sospechoso_id
         WHERE s.nombre = ?
         GROUP BY se.tipo_vinculo
         ORDER BY se.tipo_vinculo`,
      )
      .all('Bruno Torres');
    assert.deepEqual(vinculosDeBruno, [
      { tipo_vinculo: 'exculpa', peso: 5 },
      { tipo_vinculo: 'incrimina', peso: 18 },
      { tipo_vinculo: 'presencia', peso: 2 },
    ]);
  });

  test('la matriz no señala a un único sospechoso', () => {
    const matriz = conexion
      .prepare('SELECT nombre, peso_incriminatorio, peso_exculpatorio FROM vista_matriz_evidencias')
      .all();
    const pesoMaximo = Math.max(...matriz.map((fila) => fila.peso_incriminatorio));

    const empatadosEnElMaximo = matriz.filter((fila) => fila.peso_incriminatorio === pesoMaximo);
    assert.ok(empatadosEnElMaximo.length >= 2, 'el mayor peso incriminatorio debe estar compartido');

    const incriminadosSinExculpatoria = matriz.filter(
      (fila) => fila.peso_incriminatorio > 0 && fila.peso_exculpatorio === 0,
    );
    assert.deepEqual(incriminadosSinExculpatoria, []);
  });
});
