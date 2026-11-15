'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Database = require('better-sqlite3');
const request = require('supertest');
const { crearBase } = require('../../backend/database/crear-base');
const { crearApp } = require('../../backend/app');
const {
  ID_CASO,
  ID_BRUNO,
  ID_CARLA,
  ID_DIEGO,
  ID_PARTIDA_DEMO,
  FORMATO_FECHA_SQLITE,
  crearEntorno,
  crearPartida,
  agregarOtroCaso,
  afirmarTablasIntactas,
  contarFilasPorTabla,
} = require('./entorno');

const ID_INVALIDO = 'El identificador debe ser un número entero positivo.';
const PARTIDA_TERMINADA = 'La partida ya terminó: solo se permite un arresto por partida.';

/** Cuerpos inválidos para un campo de id: ausente, de otro tipo o fuera de rango. */
function cuerposInvalidos(campo) {
  return [
    {},
    { [campo]: null },
    { [campo]: 'abc' },
    { [campo]: '3' },
    { [campo]: 0 },
    { [campo]: -1 },
    { [campo]: 1.5 },
    { [campo]: true },
    { otroCampo: 3 },
  ];
}

/** Envía cuerpos que no son un objeto JSON: un string JSON, texto plano y JSON roto. */
function enviarCuerposNoJson(api, ruta) {
  return Promise.all([
    api.post(ruta).set('Content-Type', 'application/json').send('"3"'),
    api.post(ruta).type('text').send('3'),
    api.post(ruta).set('Content-Type', 'application/json').send('{"sospechosoId": 3'),
  ]);
}

function leerPartida(baseDeDatos, partidaId) {
  return baseDeDatos.prepare('SELECT id, caso_id, estado FROM partida WHERE id = ?').get(partidaId);
}

function leerAcusacion(baseDeDatos, partidaId) {
  return baseDeDatos
    .prepare('SELECT id, partida_id, sospechoso_id, fecha_acusacion FROM acusacion WHERE partida_id = ?')
    .get(partidaId);
}

describe('POST /api/partidas', () => {
  let entorno;
  beforeEach(() => {
    entorno = crearEntorno();
  });
  afterEach(() => entorno.baseDeDatos.close());

  test('crea una partida en curso y la guarda en SQLite', async () => {
    const respuesta = await entorno.api.post('/api/partidas').send({ casoId: ID_CASO });

    assert.equal(respuesta.status, 201);
    assert.deepEqual(Object.keys(respuesta.body).sort(), ['casoId', 'estado', 'fechaInicio', 'id']);
    assert.equal(respuesta.body.casoId, ID_CASO);
    assert.equal(respuesta.body.estado, 'en_curso');
    assert.match(respuesta.body.fechaInicio, FORMATO_FECHA_SQLITE);

    const guardada = entorno.baseDeDatos
      .prepare('SELECT id, caso_id, estado, fecha_inicio FROM partida WHERE id = ?')
      .get(respuesta.body.id);
    assert.deepEqual(guardada, {
      id: respuesta.body.id,
      caso_id: ID_CASO,
      estado: 'en_curso',
      fecha_inicio: respuesta.body.fechaInicio,
    });
    assert.equal(contarFilasPorTabla(entorno.baseDeDatos).partida, 2);

    const consulta = await entorno.api.get(`/api/partidas/${respuesta.body.id}`);
    assert.equal(consulta.status, 200);
    assert.deepEqual(consulta.body, respuesta.body);
  });

  test('un caso inexistente responde 404 y no crea filas', async () => {
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post('/api/partidas').send({ casoId: 999 });

    assert.equal(respuesta.status, 404);
    assert.deepEqual(respuesta.body, { error: 'El caso no existe.' });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
  });

  test('un casoId inválido o un cuerpo que no es JSON responde 400 y no crea filas', async () => {
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    for (const cuerpo of cuerposInvalidos('casoId')) {
      const respuesta = await entorno.api.post('/api/partidas').send(cuerpo);
      assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
      assert.deepEqual(respuesta.body, { error: 'El campo casoId es obligatorio y debe ser un número entero positivo.' });
    }
    for (const respuesta of await enviarCuerposNoJson(entorno.api, '/api/partidas')) {
      assert.equal(respuesta.status, 400);
      assert.equal(typeof respuesta.body.error, 'string');
    }
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
  });
});

describe('POST /api/partidas/:id/arrestos', () => {
  let entorno;
  beforeEach(() => {
    entorno = crearEntorno();
  });
  afterEach(() => entorno.baseDeDatos.close());

  test('un arresto correcto finaliza la partida como ganada y revela a la culpable', async () => {
    const partidaId = await crearPartida(entorno.api);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_CARLA });

    const acusacion = leerAcusacion(entorno.baseDeDatos, partidaId);
    assert.equal(respuesta.status, 201);
    assert.deepEqual(respuesta.body, {
      partida: { id: partidaId, casoId: ID_CASO, estado: 'ganada' },
      acusacion: { id: acusacion.id, sospechosoId: ID_CARLA, nombre: 'Carla Mendez', fechaAcusacion: acusacion.fecha_acusacion },
      resultado: 'correcto',
      culpable: { id: ID_CARLA, nombre: 'Carla Mendez' },
    });
    assert.match(acusacion.fecha_acusacion, FORMATO_FECHA_SQLITE);
    assert.equal(acusacion.sospechoso_id, ID_CARLA);
    assert.deepEqual(leerPartida(entorno.baseDeDatos, partidaId), { id: partidaId, caso_id: ID_CASO, estado: 'ganada' });

    const consulta = await entorno.api.get(`/api/partidas/${partidaId}`);
    assert.equal(consulta.body.estado, 'ganada');
  });

  test('un arresto incorrecto finaliza la partida como perdida', async () => {
    const partidaId = await crearPartida(entorno.api);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_BRUNO });

    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.body.resultado, 'incorrecto');
    assert.deepEqual(respuesta.body.partida, { id: partidaId, casoId: ID_CASO, estado: 'perdida' });
    assert.equal(respuesta.body.acusacion.sospechosoId, ID_BRUNO);
    assert.equal(respuesta.body.acusacion.nombre, 'Bruno Torres');
    assert.deepEqual(respuesta.body.culpable, { id: ID_CARLA, nombre: 'Carla Mendez' });
    assert.equal(leerAcusacion(entorno.baseDeDatos, partidaId).sospechoso_id, ID_BRUNO);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'perdida');
  });

  test('un segundo arresto se rechaza con 409 y no cambia el resultado', async () => {
    const partidaId = await crearPartida(entorno.api);
    await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_DIEGO });
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_CARLA });

    assert.equal(respuesta.status, 409);
    assert.deepEqual(respuesta.body, { error: PARTIDA_TERMINADA });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'perdida');
    assert.equal(leerAcusacion(entorno.baseDeDatos, partidaId).sospechoso_id, ID_DIEGO);
  });

  test('la partida demo ya terminada rechaza un arresto con 409', async () => {
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${ID_PARTIDA_DEMO}/arrestos`).send({ sospechosoId: ID_CARLA });

    assert.equal(respuesta.status, 409);
    assert.deepEqual(respuesta.body, { error: PARTIDA_TERMINADA });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
  });

  test('un sospechoso inexistente se rechaza con 404 y la partida sigue en curso', async () => {
    const partidaId = await crearPartida(entorno.api);
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: 999 });

    assert.equal(respuesta.status, 404);
    assert.deepEqual(respuesta.body, { error: 'El sospechoso no existe.' });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('un sospechoso de otro caso se rechaza con 400 y la partida sigue en curso', async () => {
    const { idSospechoso } = agregarOtroCaso(entorno.baseDeDatos);
    const partidaId = await crearPartida(entorno.api);
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: idSospechoso });

    assert.equal(respuesta.status, 400);
    assert.deepEqual(respuesta.body, { error: 'El sospechoso no pertenece al caso de la partida.' });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('una partida inexistente se rechaza con 404', async () => {
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post('/api/partidas/999/arrestos').send({ sospechosoId: ID_CARLA });

    assert.equal(respuesta.status, 404);
    assert.deepEqual(respuesta.body, { error: 'La partida no existe.' });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
  });

  test('los parámetros inválidos responden 400 sin registrar acusaciones', async () => {
    const partidaId = await crearPartida(entorno.api);
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    for (const idInvalido of ['abc', '0', '-1', '1.5']) {
      const respuesta = await entorno.api.post(`/api/partidas/${idInvalido}/arrestos`).send({ sospechosoId: ID_CARLA });
      assert.equal(respuesta.status, 400, idInvalido);
      assert.deepEqual(respuesta.body, { error: ID_INVALIDO });
    }
    for (const cuerpo of cuerposInvalidos('sospechosoId')) {
      const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send(cuerpo);
      assert.equal(respuesta.status, 400, JSON.stringify(cuerpo));
      assert.deepEqual(respuesta.body, { error: 'El campo sospechosoId es obligatorio y debe ser un número entero positivo.' });
    }
    for (const respuesta of await enviarCuerposNoJson(entorno.api, `/api/partidas/${partidaId}/arrestos`)) {
      assert.equal(respuesta.status, 400);
      assert.equal(typeof respuesta.body.error, 'string');
    }
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('las consultas no permiten inyección SQL en el cuerpo ni en la ruta', async () => {
    const partidaId = await crearPartida(entorno.api);
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const intentos = [
      entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: '3; DROP TABLE acusacion' }),
      entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: '3 OR 1=1' }),
      entorno.api.post('/api/partidas/1%20OR%201=1/arrestos').send({ sospechosoId: ID_CARLA }),
      entorno.api.post('/api/partidas').send({ casoId: '1); DROP TABLE partida; --' }),
    ];

    for (const respuesta of await Promise.all(intentos)) {
      assert.equal(respuesta.status, 400);
    }
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('si falla el cierre automático dentro del arresto, no queda la acusación y responde 500 sin SQL', async (t) => {
    const partidaId = await crearPartida(entorno.api);
    // Falla forzada en el UPDATE que ejecuta el trigger de cierre: SQLite
    // revierte la sentencia INSERT completa y el backend hace ROLLBACK.
    entorno.baseDeDatos.exec(`
      CREATE TEMP TRIGGER forzar_falla_al_cerrar_partida
      BEFORE UPDATE OF estado ON partida
      BEGIN
          SELECT RAISE(ABORT, 'falla forzada al cerrar la partida');
      END;
    `);
    const registroDeErrores = t.mock.method(console, 'error', () => {});
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_CARLA });

    assert.equal(respuesta.status, 500);
    assert.deepEqual(respuesta.body, { error: 'Error interno del servidor.' });
    assert.doesNotMatch(respuesta.text, /falla forzada|SQLITE|UPDATE|INSERT/i);
    assert.equal(registroDeErrores.mock.callCount(), 1);
    assert.equal(entorno.baseDeDatos.inTransaction, false);
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerAcusacion(entorno.baseDeDatos, partidaId), undefined);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('si falla una lectura posterior al INSERT, el ROLLBACK deshace la acusación y el cierre de la partida', async (t) => {
    const partidaId = await crearPartida(entorno.api);
    const baseDeDatos = entorno.baseDeDatos;
    const prepararOriginal = baseDeDatos.prepare;
    let acusacionPreparada = false;
    // Falla forzada en la primera sentencia preparada después del INSERT, cuando
    // la acusación y el cierre automático ya se ejecutaron dentro de la transacción.
    t.mock.method(baseDeDatos, 'prepare', function preparar(sql) {
      if (acusacionPreparada) throw new Error('falla forzada después del INSERT');
      if (/INSERT INTO acusacion/.test(sql)) acusacionPreparada = true;
      return prepararOriginal.call(this, sql);
    });
    t.mock.method(console, 'error', () => {});
    const filasAntes = contarFilasPorTabla(baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_CARLA });
    baseDeDatos.prepare.mock.restore();

    assert.equal(acusacionPreparada, true);
    assert.equal(respuesta.status, 500);
    assert.deepEqual(respuesta.body, { error: 'Error interno del servidor.' });
    assert.equal(baseDeDatos.inTransaction, false);
    afirmarTablasIntactas(baseDeDatos, filasAntes);
    assert.equal(leerAcusacion(baseDeDatos, partidaId), undefined);
    assert.equal(leerPartida(baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('el resultado sale del estado guardado por SQLite: si la base no cierra la partida, el arresto se revierte', async (t) => {
    const partidaId = await crearPartida(entorno.api);
    // Simula una base creada sin el trigger de cierre: el backend no calcula
    // el resultado por su cuenta y no confirma una acusación con la partida en curso.
    entorno.baseDeDatos.exec('DROP TRIGGER trg_acusacion_cerrar_partida');
    t.mock.method(console, 'error', () => {});
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);

    const respuesta = await entorno.api.post(`/api/partidas/${partidaId}/arrestos`).send({ sospechosoId: ID_CARLA });

    assert.equal(respuesta.status, 500);
    assert.deepEqual(respuesta.body, { error: 'Error interno del servidor.' });
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
    assert.equal(leerAcusacion(entorno.baseDeDatos, partidaId), undefined);
    assert.equal(leerPartida(entorno.baseDeDatos, partidaId).estado, 'en_curso');
  });

  test('las partidas independientes no se afectan entre sí', async () => {
    const ganada = await crearPartida(entorno.api);
    const perdida = await crearPartida(entorno.api);
    const enCurso = await crearPartida(entorno.api);

    await entorno.api.post(`/api/partidas/${ganada}/arrestos`).send({ sospechosoId: ID_CARLA }).expect(201);
    await entorno.api.post(`/api/partidas/${perdida}/arrestos`).send({ sospechosoId: ID_BRUNO }).expect(201);

    const estados = await Promise.all([ID_PARTIDA_DEMO, ganada, perdida, enCurso].map(
      async (id) => (await entorno.api.get(`/api/partidas/${id}`)).body.estado,
    ));
    assert.deepEqual(estados, ['perdida', 'ganada', 'perdida', 'en_curso']);
    assert.equal(leerAcusacion(entorno.baseDeDatos, enCurso), undefined);
  });
});

describe('Persistencia del arresto en un archivo SQLite', () => {
  let carpetaTemporal;
  beforeEach(() => {
    carpetaTemporal = fs.mkdtempSync(path.join(os.tmpdir(), 'detective-sql-api-'));
  });
  afterEach(() => fs.rmSync(carpetaTemporal, { recursive: true, force: true }));

  test('el resultado persiste al reabrir la base y coincide con la culpabilidad almacenada', async () => {
    const rutaBase = path.join(carpetaTemporal, 'detective.db');
    const baseDeDatos = crearBase(rutaBase);
    const api = request(crearApp(baseDeDatos));
    const partidaGanada = await crearPartida(api);
    const partidaPerdida = await crearPartida(api);
    await api.post(`/api/partidas/${partidaGanada}/arrestos`).send({ sospechosoId: ID_CARLA }).expect(201);
    await api.post(`/api/partidas/${partidaPerdida}/arrestos`).send({ sospechosoId: ID_DIEGO }).expect(201);
    baseDeDatos.close();

    const reabierta = new Database(rutaBase, { readonly: true, fileMustExist: true });
    try {
      const resultados = reabierta
        .prepare(
          `SELECT p.id, p.estado, a.sospechoso_id, s.es_culpable
           FROM partida p
           JOIN acusacion a ON a.partida_id = p.id
           JOIN sospechoso s ON s.id = a.sospechoso_id
           ORDER BY p.id`,
        )
        .all();
      assert.deepEqual(resultados, [
        { id: ID_PARTIDA_DEMO, estado: 'perdida', sospechoso_id: ID_DIEGO, es_culpable: 0 },
        { id: partidaGanada, estado: 'ganada', sospechoso_id: ID_CARLA, es_culpable: 1 },
        { id: partidaPerdida, estado: 'perdida', sospechoso_id: ID_DIEGO, es_culpable: 0 },
      ]);
    } finally {
      reabierta.close();
    }
  });
});
