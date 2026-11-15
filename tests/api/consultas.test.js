'use strict';

const { describe, test, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { leerConsultasDelScript } = require('../helpers/base-de-datos');
const {
  ID_CASO,
  ID_ELISA,
  ID_BRUNO,
  ID_CARLA,
  ID_DIEGO,
  ID_PARTIDA_DEMO,
  FORMATO_FECHA_SQLITE,
  TEXTO_DE_CULPABILIDAD,
  crearEntorno,
  agregarOtroCaso,
  afirmarTablasIntactas,
  contarFilasPorTabla,
} = require('./entorno');

const RUTAS_GET_DEL_CASO = [
  '/api/health',
  '/api/casos',
  '/api/casos/1',
  '/api/casos/1/sospechosos',
  '/api/casos/1/escenas',
  '/api/escenas/1/evidencias',
  '/api/escenas/2/evidencias',
  '/api/escenas/3/evidencias',
  '/api/sospechosos/1/interrogatorios',
  '/api/sospechosos/2/interrogatorios',
  '/api/sospechosos/3/interrogatorios',
  '/api/sospechosos/4/interrogatorios',
  '/api/casos/1/investigacion/coartadas',
  '/api/casos/1/investigacion/matriz',
  '/api/partidas/1',
];

const RUTAS_CON_ID = [
  ['/api/casos/:id', 'El caso no existe.'],
  ['/api/casos/:id/sospechosos', 'El caso no existe.'],
  ['/api/casos/:id/escenas', 'El caso no existe.'],
  ['/api/casos/:id/investigacion/coartadas', 'El caso no existe.'],
  ['/api/casos/:id/investigacion/matriz', 'El caso no existe.'],
  ['/api/escenas/:id/evidencias', 'La escena no existe.'],
  ['/api/sospechosos/:id/interrogatorios', 'El sospechoso no existe.'],
  ['/api/partidas/:id', 'La partida no existe.'],
];

const IDS_INVALIDOS = ['abc', '0', '-1', '1.5', '1e2', '99999999999999999999'];

const MATRIZ_DEL_CASO = [
  { sospechosoId: ID_ELISA, nombre: 'Elisa Rivas', cantidadIncriminatorias: 1, pesoIncriminatorio: 3, cantidadPresencias: 2, pesoExculpatorio: 4 },
  { sospechosoId: ID_BRUNO, nombre: 'Bruno Torres', cantidadIncriminatorias: 4, pesoIncriminatorio: 18, cantidadPresencias: 1, pesoExculpatorio: 5 },
  { sospechosoId: ID_CARLA, nombre: 'Carla Mendez', cantidadIncriminatorias: 4, pesoIncriminatorio: 18, cantidadPresencias: 0, pesoExculpatorio: 2 },
  { sospechosoId: ID_DIEGO, nombre: 'Diego Salas', cantidadIncriminatorias: 0, pesoIncriminatorio: 0, cantidadPresencias: 1, pesoExculpatorio: 0 },
];

describe('GET de la API sobre la base semilla', () => {
  let entorno;
  before(() => {
    entorno = crearEntorno();
  });
  after(() => entorno.baseDeDatos.close());

  test('GET /api/health responde correctamente', async () => {
    const respuesta = await entorno.api.get('/api/health');

    assert.equal(respuesta.status, 200);
    assert.match(respuesta.headers['content-type'], /application\/json/);
    assert.deepEqual(respuesta.body, { estado: 'ok' });
  });

  test('GET /api/casos devuelve el caso', async () => {
    const respuesta = await entorno.api.get('/api/casos');
    const descripcion = entorno.baseDeDatos.prepare('SELECT descripcion FROM caso WHERE id = ?').pluck().get(ID_CASO);

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, [
      { id: ID_CASO, titulo: 'El silencio del archivo', descripcion, fechaApertura: '2026-11-10', estado: 'abierto' },
    ]);
  });

  test('GET /api/casos/:id devuelve los datos públicos del caso y su escena principal', async () => {
    const respuesta = await entorno.api.get('/api/casos/1');
    const descripcion = entorno.baseDeDatos.prepare('SELECT descripcion FROM caso WHERE id = ?').pluck().get(ID_CASO);

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, {
      id: ID_CASO,
      titulo: 'El silencio del archivo',
      descripcion,
      fechaApertura: '2026-11-10',
      estado: 'abierto',
      escenaPrincipal: { lugar: 'Archivo municipal', tipoLugar: 'oficina', horaSuceso: '2026-11-09 21:30:00' },
    });
  });

  test('GET de sospechosos devuelve nombre, relación con la víctima y coartada, sin exponer es_culpable', async () => {
    const respuesta = await entorno.api.get('/api/casos/1/sospechosos');

    assert.equal(respuesta.status, 200);
    assert.doesNotMatch(respuesta.text, TEXTO_DE_CULPABILIDAD);
    const desde = '2026-11-09 21:00:00';
    const hasta = '2026-11-09 22:00:00';
    assert.deepEqual(respuesta.body, [
      { id: ID_ELISA, nombre: 'Elisa Rivas', relacionVictima: 'Hermana de la victima', coartada: 'Afirmo que estuvo en el hospital toda la noche.', lugarCoartada: 'Hospital Central', coartadaDesde: desde, coartadaHasta: hasta },
      { id: ID_BRUNO, nombre: 'Bruno Torres', relacionVictima: 'Exsocio de la victima', coartada: 'Afirmo que estuvo en su casa desde las 21:00.', lugarCoartada: 'Domicilio de Bruno', coartadaDesde: desde, coartadaHasta: hasta },
      { id: ID_CARLA, nombre: 'Carla Mendez', relacionVictima: 'Empleada del archivo', coartada: 'Afirmo que ceno en un restaurante entre las 21:00 y las 22:00.', lugarCoartada: 'Restaurante Central', coartadaDesde: desde, coartadaHasta: hasta },
      { id: ID_DIEGO, nombre: 'Diego Salas', relacionVictima: 'Proveedor del archivo', coartada: 'Afirmo que estuvo entrenando en el gimnasio.', lugarCoartada: 'Gimnasio Norte', coartadaDesde: desde, coartadaHasta: hasta },
    ]);
  });

  test('GET de escenas devuelve las escenas existentes con su lugar y cantidad de evidencias', async () => {
    const respuesta = await entorno.api.get('/api/casos/1/escenas');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, [
      { id: 1, lugar: 'Archivo municipal', tipoLugar: 'oficina', horaSuceso: '2026-11-09 21:30:00', esPrincipal: true, cantidadEvidencias: 11 },
      { id: 2, lugar: 'Estacionamiento municipal', tipoLugar: 'estacionamiento', horaSuceso: '2026-11-09 21:20:00', esPrincipal: false, cantidadEvidencias: 4 },
      { id: 3, lugar: 'Cafe Bahia', tipoLugar: 'cafeteria', horaSuceso: '2026-11-09 21:10:00', esPrincipal: false, cantidadEvidencias: 3 },
    ]);
  });

  test('GET de evidencias devuelve únicamente las correspondientes a la escena, con sus vínculos', async () => {
    const respuesta = await entorno.api.get('/api/escenas/2/evidencias');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, [
      {
        id: 5, tipo: 'registro_digital', descripcion: 'Camara del estacionamiento a las 21:19.', relevancia: 4, horaIndicio: '2026-11-09 21:19:00',
        vinculos: [{ sospechosoId: ID_ELISA, nombre: 'Elisa Rivas', tipoVinculo: 'presencia', peso: 2, observaciones: 'La camara sitúa a Elisa fuera del hospital durante su coartada.' }],
      },
      {
        id: 6, tipo: 'registro_digital', descripcion: 'Camara del estacionamiento a las 21:22.', relevancia: 4, horaIndicio: '2026-11-09 21:22:00',
        vinculos: [{ sospechosoId: ID_DIEGO, nombre: 'Diego Salas', tipoVinculo: 'presencia', peso: 2, observaciones: 'La camara sitúa a Diego fuera del gimnasio durante su coartada.' }],
      },
      { id: 9, tipo: 'objeto', descripcion: 'Ticket de estacionamiento sin identidad asociada.', relevancia: 2, horaIndicio: null, vinculos: [] },
      {
        id: 17, tipo: 'registro_digital', descripcion: 'Camara del estacionamiento que muestra a una mujer todavia dentro de su auto a las 21:30.', relevancia: 4, horaIndicio: '2026-11-09 21:30:00',
        vinculos: [{ sospechosoId: ID_ELISA, nombre: 'Elisa Rivas', tipoVinculo: 'exculpa', peso: 4, observaciones: 'La mujer del auto es Elisa: seguia en el estacionamiento a la hora del crimen.' }],
      },
    ]);
  });

  test('cada escena devuelve exactamente las evidencias que SQLite guarda para ella', async () => {
    for (const escenaId of [1, 2, 3]) {
      const respuesta = await entorno.api.get(`/api/escenas/${escenaId}/evidencias`);
      const idsGuardados = entorno.baseDeDatos
        .prepare('SELECT id FROM evidencia WHERE escena_id = ? ORDER BY id')
        .pluck()
        .all(escenaId);

      assert.equal(respuesta.status, 200);
      assert.deepEqual(respuesta.body.map((evidencia) => evidencia.id), idsGuardados);
    }
  });

  test('GET de interrogatorios devuelve las declaraciones y contradicciones del sospechoso', async () => {
    const respuesta = await entorno.api.get('/api/sospechosos/2/interrogatorios');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, [
      { id: 2, fechaHora: '2026-11-10 10:20:00', declaracion: 'No sali de mi casa despues de las 21:00.', contradiccion: 'Una compra confirmada la ubica en Cafe Bahia a las 21:08.' },
      { id: 5, fechaHora: '2026-11-11 09:30:00', declaracion: 'Admito que menti: estuve en Cafe Bahia desde las 21:05 hasta pasadas las 21:30.', contradiccion: null },
    ]);
  });

  test('GET de coartadas ejecuta la consulta de descarte (C1) filtrada por el caso', async () => {
    const respuesta = await entorno.api.get('/api/casos/1/investigacion/coartadas');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, [
      { sospechosoId: ID_ELISA, nombre: 'Elisa Rivas', lugarDeclarado: 'Hospital Central', lugarObservado: 'Estacionamiento municipal', horaIndicio: '2026-11-09 21:19:00', evidenciaId: 5 },
      { sospechosoId: ID_ELISA, nombre: 'Elisa Rivas', lugarDeclarado: 'Hospital Central', lugarObservado: 'Estacionamiento municipal', horaIndicio: '2026-11-09 21:30:00', evidenciaId: 17 },
      { sospechosoId: ID_BRUNO, nombre: 'Bruno Torres', lugarDeclarado: 'Domicilio de Bruno', lugarObservado: 'Cafe Bahia', horaIndicio: '2026-11-09 21:08:00', evidenciaId: 7 },
      { sospechosoId: ID_BRUNO, nombre: 'Bruno Torres', lugarDeclarado: 'Domicilio de Bruno', lugarObservado: 'Cafe Bahia', horaIndicio: '2026-11-09 21:30:00', evidenciaId: 15 },
      { sospechosoId: ID_CARLA, nombre: 'Carla Mendez', lugarDeclarado: 'Restaurante Central', lugarObservado: 'Archivo municipal', horaIndicio: '2026-11-09 21:29:00', evidenciaId: 2 },
      { sospechosoId: ID_DIEGO, nombre: 'Diego Salas', lugarDeclarado: 'Gimnasio Norte', lugarObservado: 'Estacionamiento municipal', horaIndicio: '2026-11-09 21:22:00', evidenciaId: 6 },
    ]);

    // Mismas filas que la consulta C1 del script académico.
    const filasC1 = entorno.baseDeDatos.prepare(leerConsultasDelScript().get(1).sql).all();
    assert.deepEqual(
      respuesta.body.map(({ sospechosoId, nombre, lugarDeclarado, lugarObservado, horaIndicio }) => ({
        id: sospechosoId, nombre, lugar_declarado: lugarDeclarado, lugar_observado: lugarObservado, hora_indicio: horaIndicio,
      })),
      filasC1,
    );
  });

  test('GET de la matriz devuelve los conteos y pesos de la vista, ordenados por sospechoso', async () => {
    const respuesta = await entorno.api.get('/api/casos/1/investigacion/matriz');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body, MATRIZ_DEL_CASO);
  });

  test('GET /api/partidas/:id devuelve solo id, caso, estado y fecha de inicio de la partida demo', async () => {
    const respuesta = await entorno.api.get('/api/partidas/1');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(Object.keys(respuesta.body).sort(), ['casoId', 'estado', 'fechaInicio', 'id']);
    assert.equal(respuesta.body.id, ID_PARTIDA_DEMO);
    assert.equal(respuesta.body.casoId, ID_CASO);
    assert.equal(respuesta.body.estado, 'perdida');
    assert.match(respuesta.body.fechaInicio, FORMATO_FECHA_SQLITE);
  });

  test('ninguna respuesta GET expone es_culpable ni un dato equivalente', async () => {
    for (const ruta of RUTAS_GET_DEL_CASO) {
      const respuesta = await entorno.api.get(ruta);

      assert.equal(respuesta.status, 200, ruta);
      assert.doesNotMatch(respuesta.text, TEXTO_DE_CULPABILIDAD, ruta);
    }
  });

  test('un recurso inexistente en la ruta responde 404 con un mensaje en español', async () => {
    for (const [plantilla, mensaje] of RUTAS_CON_ID) {
      const respuesta = await entorno.api.get(plantilla.replace(':id', '999'));

      assert.equal(respuesta.status, 404, plantilla);
      assert.deepEqual(respuesta.body, { error: mensaje }, plantilla);
    }
  });

  test('un id que no es un entero positivo responde 400', async () => {
    for (const [plantilla] of RUTAS_CON_ID) {
      for (const idInvalido of IDS_INVALIDOS) {
        const ruta = plantilla.replace(':id', idInvalido);
        const respuesta = await entorno.api.get(ruta);

        assert.equal(respuesta.status, 400, ruta);
        assert.deepEqual(respuesta.body, { error: 'El identificador debe ser un número entero positivo.' }, ruta);
      }
    }
  });

  test('las consultas no permiten inyección SQL a través de la ruta', async () => {
    const filasAntes = contarFilasPorTabla(entorno.baseDeDatos);
    const intentos = [
      '/api/casos/1%20OR%201=1',
      '/api/casos/1%20OR%201=1/sospechosos',
      "/api/escenas/1'%20OR%20'1'='1/evidencias",
      '/api/sospechosos/1;DROP%20TABLE%20interrogatorio/interrogatorios',
      '/api/partidas/1;%20DELETE%20FROM%20partida',
    ];

    for (const ruta of intentos) {
      const respuesta = await entorno.api.get(ruta);
      assert.equal(respuesta.status, 400, ruta);
    }
    afirmarTablasIntactas(entorno.baseDeDatos, filasAntes);
  });
});

describe('GET de la API calculados en SQLite', () => {
  let entorno;
  beforeEach(() => {
    entorno = crearEntorno();
  });
  afterEach(() => entorno.baseDeDatos.close());

  test('la matriz de evidencias se calcula desde SQLite: refleja un vínculo nuevo', async () => {
    entorno.baseDeDatos
      .prepare('INSERT INTO evidencia (id, escena_id, tipo, descripcion, relevancia) VALUES (?, ?, ?, ?, ?)')
      .run(19, 2, 'objeto', 'Llave del gimnasio olvidada en el estacionamiento.', 3);
    entorno.baseDeDatos
      .prepare('INSERT INTO sospechoso_evidencia (sospechoso_id, evidencia_id, tipo_vinculo, peso, observaciones) VALUES (?, ?, ?, ?, ?)')
      .run(ID_DIEGO, 19, 'incrimina', 3, 'La llave es de Diego.');

    const respuesta = await entorno.api.get('/api/casos/1/investigacion/matriz');

    assert.equal(respuesta.status, 200);
    assert.deepEqual(respuesta.body[3], {
      sospechosoId: ID_DIEGO, nombre: 'Diego Salas', cantidadIncriminatorias: 1, pesoIncriminatorio: 3, cantidadPresencias: 1, pesoExculpatorio: 0,
    });
    assert.deepEqual(respuesta.body.slice(0, 3), MATRIZ_DEL_CASO.slice(0, 3));
  });

  test('sospechosos, escenas, coartadas y matriz se filtran por el caso pedido', async () => {
    const { idCaso, idSospechoso } = agregarOtroCaso(entorno.baseDeDatos);

    const sospechosos = await entorno.api.get(`/api/casos/${idCaso}/sospechosos`);
    const escenas = await entorno.api.get(`/api/casos/${idCaso}/escenas`);
    const coartadas = await entorno.api.get(`/api/casos/${idCaso}/investigacion/coartadas`);
    const matriz = await entorno.api.get(`/api/casos/${idCaso}/investigacion/matriz`);
    const sospechososDelCaso1 = await entorno.api.get('/api/casos/1/sospechosos');

    assert.deepEqual(sospechosos.body.map((sospechoso) => sospechoso.id), [idSospechoso]);
    assert.deepEqual(escenas.body, []);
    assert.deepEqual(coartadas.body, []);
    assert.deepEqual(matriz.body.map((fila) => fila.sospechosoId), [idSospechoso]);
    assert.deepEqual(sospechososDelCaso1.body.map((sospechoso) => sospechoso.id), [ID_ELISA, ID_BRUNO, ID_CARLA, ID_DIEGO]);
  });

  test('GET /api/casos/:id devuelve escenaPrincipal null si el caso no tiene escena principal', async () => {
    const { idCaso } = agregarOtroCaso(entorno.baseDeDatos);

    const respuesta = await entorno.api.get(`/api/casos/${idCaso}`);

    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.escenaPrincipal, null);
  });
});
