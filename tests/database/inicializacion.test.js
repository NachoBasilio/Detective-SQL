'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearBase, validarCasosJugables, RUTA_SCRIPT_SQL } = require('../../backend/database/crear-base');
const { afirmarRechazoSinCambios } = require('../helpers/base-de-datos');

const ID_ELISA = 1;
const ID_CARLA = 3;

const ERROR_CASO_SIN_CULPABLE = /Cada caso con sospechosos debe tener exactamente un culpable\. Caso 1 \("El silencio del archivo"\): 0 culpables\./;

describe('Exactamente un culpable por caso', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('el índice único parcial impide un segundo culpable en el mismo caso', () => {
    afirmarRechazoSinCambios(
      conexion,
      () => conexion.prepare('UPDATE sospechoso SET es_culpable = 1 WHERE id = ?').run(ID_ELISA),
      { code: 'SQLITE_CONSTRAINT_UNIQUE' },
    );
  });

  test('el índice único no impide dejar un caso sin culpable: lo detecta la validación', () => {
    assert.doesNotThrow(() => validarCasosJugables(conexion));

    conexion.prepare('UPDATE sospechoso SET es_culpable = 0 WHERE id = ?').run(ID_CARLA);

    assert.throws(() => validarCasosJugables(conexion), ERROR_CASO_SIN_CULPABLE);
  });

  test('un caso todavía sin sospechosos no se valida: se pueden cargar casos de a un sospechoso', () => {
    conexion
      .prepare('INSERT INTO caso (titulo, descripcion, fecha_apertura) VALUES (?, ?, ?)')
      .run('Caso en preparacion', 'Caso sin sospechosos cargados.', '2026-11-15');

    assert.doesNotThrow(() => validarCasosJugables(conexion));
  });
});

describe('crearBase valida los casos al inicializar', () => {
  test('falla con un error claro si el script deja un caso sin culpable', (t) => {
    const leerArchivo = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', (ruta, ...opciones) => {
      const contenido = leerArchivo(ruta, ...opciones);
      return ruta === RUTA_SCRIPT_SQL
        ? `${contenido}\nUPDATE sospechoso SET es_culpable = 0 WHERE id = ${ID_CARLA};\n`
        : contenido;
    });

    assert.throws(() => crearBase(':memory:'), ERROR_CASO_SIN_CULPABLE);
  });
});

describe('crearBase no deja archivos de una creación rechazada', () => {
  let carpeta;

  beforeEach(() => {
    carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'detective-crear-base-'));
  });
  afterEach(() => fs.rmSync(carpeta, { recursive: true, force: true }));

  function simularScriptSinCulpable(t) {
    const leerArchivo = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', (ruta, ...opciones) => {
      const contenido = leerArchivo(ruta, ...opciones);
      return ruta === RUTA_SCRIPT_SQL
        ? `${contenido}\nUPDATE sospechoso SET es_culpable = 0 WHERE id = ${ID_CARLA};\n`
        : contenido;
    });
  }

  test('si la validación falla sobre un archivo nuevo, el archivo se borra', (t) => {
    const ruta = path.join(carpeta, 'nueva.db');
    simularScriptSinCulpable(t);

    assert.throws(() => crearBase(ruta), ERROR_CASO_SIN_CULPABLE);
    assert.deepEqual(fs.readdirSync(carpeta), []);
  });

  test('si el archivo ya existía, no se borra aunque la creación falle', (t) => {
    const ruta = path.join(carpeta, 'existente.db');
    fs.writeFileSync(ruta, '');
    simularScriptSinCulpable(t);

    assert.throws(() => crearBase(ruta), ERROR_CASO_SIN_CULPABLE);
    assert.equal(fs.existsSync(ruta), true);
  });
});
