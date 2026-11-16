'use strict';

// Traducción de la interfaz. Los módulos de frontend/js/i18n/ son ES modules
// puros: se importan desde Node sin DOM. La base y la API siguen en español;
// estos tests comprueban que todo lo que la interfaz muestra tenga inglés.

const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { describe, test, before, after } = require('node:test');
const request = require('supertest');
const { crearBase } = require('../../backend/database/crear-base');
const { crearApp } = require('../../backend/app');
const { agregarOtroCaso } = require('../api/entorno');

const CARPETA_I18N = path.join(__dirname, '..', '..', 'frontend', 'js', 'i18n');
const importar = (archivo) => import(pathToFileURL(path.join(CARPETA_I18N, archivo)).href);

/** Columnas de texto libre que la interfaz muestra. Los nombres de personas no se traducen. */
const CONSULTAS_DE_TEXTOS = [
  'SELECT titulo FROM caso',
  'SELECT descripcion FROM caso',
  'SELECT nombre FROM lugar',
  'SELECT coartada FROM sospechoso',
  'SELECT relacion_victima FROM sospechoso',
  'SELECT descripcion FROM evidencia',
  'SELECT observaciones FROM sospechoso_evidencia WHERE observaciones IS NOT NULL',
  'SELECT declaracion FROM interrogatorio',
  'SELECT contradiccion_detectada FROM interrogatorio WHERE contradiccion_detectada IS NOT NULL',
];

const marcas = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((marca) => marca[1]).sort();

describe('Traducción de la interfaz (es/en)', () => {
  let i18n;
  let baseDeDatos;

  before(async () => {
    const [catalogos, contenido, traductor] = await Promise.all([
      importar('catalogos.js'),
      importar('contenido.js'),
      importar('traductor.js'),
    ]);
    i18n = { ...catalogos, ...contenido, ...traductor };
    baseDeDatos = crearBase(':memory:');
  });
  after(() => {
    i18n.establecerIdioma(i18n.IDIOMA_PREDETERMINADO);
    baseDeDatos.close();
  });

  test('los catálogos es y en tienen las mismas claves, las mismas formas plurales y las mismas marcas', () => {
    const { CATALOGOS } = i18n;
    assert.deepEqual(Object.keys(CATALOGOS).sort(), ['en', 'es']);
    assert.deepEqual(Object.keys(CATALOGOS.en).sort(), Object.keys(CATALOGOS.es).sort());

    for (const clave of Object.keys(CATALOGOS.es)) {
      const es = CATALOGOS.es[clave];
      const en = CATALOGOS.en[clave];
      assert.equal(typeof en, typeof es, clave);
      const formasEs = typeof es === 'string' ? { texto: es } : es;
      const formasEn = typeof en === 'string' ? { texto: en } : en;
      if (typeof es !== 'string') assert.ok(Object.hasOwn(es, 'one') && Object.hasOwn(es, 'other'), clave);
      assert.deepEqual(Object.keys(formasEn).sort(), Object.keys(formasEs).sort(), clave);
      for (const forma of Object.keys(formasEs)) {
        assert.notEqual(formasEn[forma].trim(), '', `${clave}.${forma}`);
        assert.deepEqual(marcas(formasEn[forma]), marcas(formasEs[forma]), `${clave}.${forma}`);
      }
    }
  });

  test('cada valor fijo de la base y cada resultado del arresto tienen traducción', () => {
    const { ENUMERADOS } = i18n;
    const sqlDeTabla = (tabla) => baseDeDatos
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
      .pluck()
      .get(tabla);
    const valoresDelCheck = (tabla, columna) => {
      const check = new RegExp(`CHECK\\s*\\(\\s*${columna}\\s+IN\\s*\\(([^)]*)\\)\\)`).exec(sqlDeTabla(tabla));
      assert.ok(check, `${tabla}.${columna} tiene un CHECK con la lista de valores`);
      return [...check[1].matchAll(/'([^']*)'/g)].map((valor) => valor[1]);
    };

    const esperados = {
      estadoCaso: valoresDelCheck('caso', 'estado'),
      estadoPartida: valoresDelCheck('partida', 'estado'),
      tipoEvidencia: valoresDelCheck('evidencia', 'tipo'),
      tipoVinculo: valoresDelCheck('sospechoso_evidencia', 'tipo_vinculo'),
      // tipo_lugar es texto libre en la base, pero la interfaz lo muestra como una categoría.
      tipoLugar: baseDeDatos.prepare('SELECT DISTINCT tipo_lugar FROM lugar ORDER BY tipo_lugar').pluck().all(),
      // Lo calcula backend/services/partidas.js a partir del estado que guardó SQLite.
      resultado: ['correcto', 'incorrecto'],
    };

    for (const [grupo, valores] of Object.entries(esperados)) {
      assert.ok(valores.length > 0, grupo);
      for (const idioma of ['es', 'en']) {
        const faltantes = valores.filter((valor) => !Object.hasOwn(ENUMERADOS[idioma][grupo] ?? {}, valor));
        assert.deepEqual(faltantes, [], `${idioma}.${grupo}`);
      }
    }
  });

  test('cada texto libre de la semilla que muestra la interfaz tiene traducción al inglés', () => {
    const { CONTENIDO_EN } = i18n;
    const textos = new Set(CONSULTAS_DE_TEXTOS.flatMap((sql) => baseDeDatos.prepare(sql).pluck().all()));

    assert.ok(textos.size > 0);
    assert.deepEqual([...textos].filter((texto) => !Object.hasOwn(CONTENIDO_EN, texto)), []);
    // Y el diccionario no guarda textos que ya no están en la semilla.
    assert.deepEqual(Object.keys(CONTENIDO_EN).filter((texto) => !textos.has(texto)), []);
    for (const traduccion of Object.values(CONTENIDO_EN)) assert.notEqual(traduccion.trim(), '');
  });

  test('en inglés se traducen los textos conocidos; los nombres de personas y los textos desconocidos quedan igual', () => {
    i18n.establecerIdioma('en');
    try {
      assert.equal(i18n.traducirContenido('Domicilio de Bruno'), 'Bruno’s home');
      for (const nombre of baseDeDatos.prepare('SELECT nombre FROM sospechoso').pluck().all()) {
        assert.equal(i18n.traducirContenido(nombre), nombre);
      }
      assert.equal(i18n.traducirContenido('Texto que no está en la semilla.'), 'Texto que no está en la semilla.');
      assert.equal(i18n.traducirContenido('constructor'), 'constructor');
      assert.equal(i18n.traducirEnum('estadoPartida', 'en_curso'), 'ongoing');
      assert.equal(i18n.traducirEnum('tipoLugar', 'faro'), 'faro');
      assert.equal(i18n.traducirErrorDeApi('Mensaje desconocido.'), 'Mensaje desconocido.');
    } finally {
      i18n.establecerIdioma('es');
    }
    assert.equal(i18n.traducirContenido('Domicilio de Bruno'), 'Domicilio de Bruno');
    assert.equal(i18n.traducirEnum('tipoEvidencia', 'registro_digital'), 'registro digital');
  });

  test('cada mensaje de error que devuelve la API tiene traducción al inglés', async () => {
    const base = crearBase(':memory:');
    try {
      const api = request(crearApp(base));
      const { idSospechoso: deOtroCaso } = agregarOtroCaso(base);
      const { body: partida } = await api.post('/api/partidas').send({ casoId: 1 });
      const respuestas = await Promise.all([
        api.get('/api/inexistente'),
        api.get('/api/casos/abc'),
        api.get('/api/casos/999'),
        api.get('/api/escenas/999/evidencias'),
        api.get('/api/sospechosos/999/interrogatorios'),
        api.get('/api/partidas/999'),
        api.get('/api/partidas?casoId=abc'),
        api.get('/api/partidas?estado=en_curso&estado=perdida'),
        api.post('/api/partidas').send({}),
        api.post('/api/partidas').send({ casoId: 999 }),
        api.post('/api/partidas').set('Content-Type', 'application/json').send('{"casoId": '),
        api.post(`/api/partidas/${partida.id}/arrestos`).send({}),
        api.post(`/api/partidas/${partida.id}/arrestos`).send({ sospechosoId: 999 }),
        api.post(`/api/partidas/${partida.id}/arrestos`).send({ sospechosoId: deOtroCaso }),
        api.post('/api/partidas/1/arrestos').send({ sospechosoId: 3 }),
      ]);
      const mensajes = new Set(respuestas.map((respuesta) => respuesta.body.error));
      // Los que no se provocan sin forzar una falla del servidor.
      mensajes.add('La solicitud no es válida.');
      mensajes.add('Error interno del servidor.');

      assert.ok(!mensajes.has(undefined));
      assert.deepEqual([...mensajes].filter((mensaje) => !Object.hasOwn(i18n.ERRORES_DE_API_EN, mensaje)), []);
    } finally {
      base.close();
    }
  });

  test('t interpola parámetros, elige la forma plural y formatea fechas según el idioma', () => {
    assert.equal(i18n.idiomaActual(), 'es');
    assert.equal(i18n.t('comun.partida', { id: 3 }), 'Partida n.º 3');
    assert.equal(i18n.t('investigacion.evidencias', { cantidad: 1 }), '1 evidencia');
    assert.equal(i18n.t('investigacion.evidencias', { cantidad: 4 }), '4 evidencias');
    assert.equal(i18n.formatearFecha('2026-11-09 21:30:00'), '09/11/2026 21:30');
    assert.equal(i18n.formatearFecha('2026-11-10'), '10/11/2026');
    assert.equal(i18n.formatearRango('2026-11-09 21:00:00', '2026-11-09 22:00:00'), '09/11/2026, de 21:00 a 22:00');
    assert.equal(i18n.formatearFecha('no es una fecha'), 'no es una fecha');
    assert.equal(i18n.t('clave.inexistente'), 'clave.inexistente');

    const nombre = { nodo: true };
    assert.deepEqual(i18n.partes('acusacion.confirmarTexto', { nombre, relacion: 'Proveedor' }), [
      'Va a emitir una orden de arresto contra ', nombre, ' (', 'Proveedor', ').',
    ]);

    assert.equal(i18n.establecerIdioma('fr'), false);
    assert.equal(i18n.establecerIdioma('en'), true);
    try {
      assert.equal(i18n.t('comun.partida', { id: 3 }), 'Game #3');
      assert.equal(i18n.t('investigacion.evidencias', { cantidad: 1 }), '1 piece of evidence');
      assert.equal(i18n.t('investigacion.evidencias', { cantidad: 4 }), '4 pieces of evidence');
      // El texto exacto de Intl puede variar con la versión de ICU: se comprueban sus partes.
      assert.match(i18n.formatearFecha('2026-11-09 21:30:00'), /Nov 9, 2026.*21:30/);
      assert.match(i18n.formatearRango('2026-11-09 21:00:00', '2026-11-09 22:00:00'), /from 21:00 to 22:00$/);
      assert.match(i18n.formatearMarcaUtc('2026-11-15 13:05:00'), /2026/);
    } finally {
      i18n.establecerIdioma('es');
    }
  });
});
