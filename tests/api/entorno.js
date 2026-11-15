'use strict';

// Utilidades compartidas por los tests de la API. Cada entorno arma la
// aplicación Express real sobre una base SQLite en memoria creada con
// database/detective.sql: no hay respuestas simuladas.

const assert = require('node:assert/strict');
const request = require('supertest');
const { crearBase } = require('../../backend/database/crear-base');
const { crearApp } = require('../../backend/app');
const { TABLAS_DEL_MODELO, contarFilasPorTabla } = require('../helpers/base-de-datos');

const ID_CASO = 1;
const ID_ELISA = 1;
const ID_BRUNO = 2;
const ID_CARLA = 3;
const ID_DIEGO = 4;
const ID_PARTIDA_DEMO = 1;

const FORMATO_FECHA_SQLITE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

// Cualquier forma de nombrar la culpabilidad: es_culpable, esCulpable, culpable...
const TEXTO_DE_CULPABILIDAD = /culpab/i;

/** Base en memoria recién creada y un cliente HTTP de la aplicación sobre ella. */
function crearEntorno() {
  const baseDeDatos = crearBase(':memory:');
  return { baseDeDatos, api: request(crearApp(baseDeDatos)) };
}

/** Crea una partida del caso por la API y devuelve su id. */
async function crearPartida(api, casoId = ID_CASO) {
  const respuesta = await api.post('/api/partidas').send({ casoId });
  assert.equal(respuesta.status, 201);
  return respuesta.body.id;
}

/** Agrega un segundo caso con un sospechoso propio (id 5) a la base del test. */
function agregarOtroCaso(baseDeDatos) {
  baseDeDatos
    .prepare('INSERT INTO caso (id, titulo, descripcion, fecha_apertura) VALUES (?, ?, ?, ?)')
    .run(2, 'El robo del museo', 'Desaparece una pieza del museo.', '2026-11-12');
  baseDeDatos
    .prepare(
      `INSERT INTO sospechoso
       (id, caso_id, nombre, coartada, lugar_coartada_id, coartada_desde, coartada_hasta, relacion_victima)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(5, 2, 'Hugo Paz', 'Afirmo que estuvo en el gimnasio.', 7, '2026-11-11 20:00:00', '2026-11-11 21:00:00', 'Guardia del museo');
  return { idCaso: 2, idSospechoso: 5 };
}

/** Verifica que las nueve tablas sigan existiendo y con las mismas filas. */
function afirmarTablasIntactas(baseDeDatos, filasAntes) {
  const tablas = baseDeDatos
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .pluck()
    .all();
  assert.deepEqual(tablas, TABLAS_DEL_MODELO);
  assert.deepEqual(contarFilasPorTabla(baseDeDatos), filasAntes);
}

module.exports = {
  ID_CASO,
  ID_ELISA,
  ID_BRUNO,
  ID_CARLA,
  ID_DIEGO,
  ID_PARTIDA_DEMO,
  FORMATO_FECHA_SQLITE,
  TEXTO_DE_CULPABILIDAD,
  crearEntorno,
  crearPartida,
  agregarOtroCaso,
  afirmarTablasIntactas,
  contarFilasPorTabla,
};
