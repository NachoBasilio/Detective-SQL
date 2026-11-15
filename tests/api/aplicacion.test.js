'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { crearApp } = require('../../backend/app');
const { crearEntorno } = require('./entorno');

const CARPETA_FRONTEND = path.join(__dirname, '..', '..', 'frontend');
const INDICE_FRONTEND = path.join(CARPETA_FRONTEND, 'index.html');

describe('Aplicación Express', () => {
  let entorno;
  beforeEach(() => {
    entorno = crearEntorno();
  });
  afterEach(() => {
    if (entorno.baseDeDatos.open) entorno.baseDeDatos.close();
  });

  test('una ruta desconocida de la API responde 404 en JSON', async () => {
    for (const respuesta of [
      await entorno.api.get('/api/inexistente'),
      await entorno.api.get('/api'),
      await entorno.api.delete('/api/casos/1'),
    ]) {
      assert.equal(respuesta.status, 404);
      assert.match(respuesta.headers['content-type'], /application\/json/);
      assert.deepEqual(respuesta.body, { error: 'La ruta solicitada no existe en la API.' });
    }
  });

  test('un cuerpo JSON mal formado responde 400 en JSON', async () => {
    const respuesta = await entorno.api
      .post('/api/partidas')
      .set('Content-Type', 'application/json')
      .send('{"casoId": ');

    assert.equal(respuesta.status, 400);
    assert.deepEqual(respuesta.body, { error: 'El cuerpo de la solicitud debe ser un JSON válido.' });
  });

  test('GET /api/health consulta la base: si la conexión falla responde 500 sin detalles', async (t) => {
    const registroDeErrores = t.mock.method(console, 'error', () => {});
    entorno.baseDeDatos.close();

    const respuesta = await entorno.api.get('/api/health');

    assert.equal(respuesta.status, 500);
    assert.deepEqual(respuesta.body, { error: 'Error interno del servidor.' });
    assert.equal(registroDeErrores.mock.callCount(), 1);
  });

  test('el middleware estático sirve la carpeta frontend/', async () => {
    // serve-static redirige un directorio existente a su versión con barra
    // final: prueba que frontend/ está montado sin depender de un archivo.
    const respuesta = await entorno.api.get('/css');

    assert.equal(respuesta.status, 301);
    assert.equal(respuesta.headers.location, '/css/');
  });

  test(
    'GET / sirve frontend/index.html',
    { skip: !fs.existsSync(INDICE_FRONTEND) && 'frontend/index.html todavía no existe' },
    async () => {
      const respuesta = await entorno.api.get('/');

      assert.equal(respuesta.status, 200);
      assert.match(respuesta.headers['content-type'], /text\/html/);
      assert.equal(respuesta.text, fs.readFileSync(INDICE_FRONTEND, 'utf8'));
    },
  );
});

describe('crearApp', () => {
  test('rechaza una conexión SQLite sin claves foráneas activas', () => {
    // better-sqlite3 las activa por defecto: se apagan para simular una
    // conexión mal configurada.
    const conexionSinClaves = new Database(':memory:');
    conexionSinClaves.pragma('foreign_keys = OFF');
    try {
      assert.throws(() => crearApp(conexionSinClaves), /claves foráneas/);
    } finally {
      conexionSinClaves.close();
    }
  });
});
