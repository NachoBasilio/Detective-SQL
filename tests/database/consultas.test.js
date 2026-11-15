'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { leerConsultasDelScript } = require('../helpers/base-de-datos');

const consultas = leerConsultasDelScript();

describe('Diez consultas de database/detective.sql', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  function ejecutar(numero) {
    return conexion.prepare(consultas.get(numero).sql).all();
  }

  test('el script define las consultas C1 a C10, cada una con su enunciado', () => {
    assert.deepEqual([...consultas.keys()], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const { enunciado, sql } of consultas.values()) {
      assert.ok(enunciado.length > 0);
      assert.match(sql, /^SELECT\b/i);
    }
  });

  test('las diez consultas son sentencias únicas que se ejecutan sin errores', () => {
    for (const numero of consultas.keys()) {
      assert.doesNotThrow(() => ejecutar(numero), `C${numero} falló`);
    }
  });

  test('C1 descarta la coartada de los cuatro sospechosos comparando lugares', () => {
    assert.deepEqual(ejecutar(1), [
      { id: 1, nombre: 'Elisa Rivas', lugar_declarado: 'Hospital Central',
        lugar_observado: 'Estacionamiento municipal', hora_indicio: '2026-11-09 21:19:00' },
      { id: 1, nombre: 'Elisa Rivas', lugar_declarado: 'Hospital Central',
        lugar_observado: 'Estacionamiento municipal', hora_indicio: '2026-11-09 21:30:00' },
      { id: 2, nombre: 'Bruno Torres', lugar_declarado: 'Domicilio de Bruno',
        lugar_observado: 'Cafe Bahia', hora_indicio: '2026-11-09 21:08:00' },
      { id: 2, nombre: 'Bruno Torres', lugar_declarado: 'Domicilio de Bruno',
        lugar_observado: 'Cafe Bahia', hora_indicio: '2026-11-09 21:30:00' },
      { id: 3, nombre: 'Carla Mendez', lugar_declarado: 'Restaurante Central',
        lugar_observado: 'Archivo municipal', hora_indicio: '2026-11-09 21:29:00' },
      { id: 4, nombre: 'Diego Salas', lugar_declarado: 'Gimnasio Norte',
        lugar_observado: 'Estacionamiento municipal', hora_indicio: '2026-11-09 21:22:00' },
    ]);
    assert.match(consultas.get(1).sql, /lugar_coartada_id/);
  });

  test('C2 muestra la matriz con pesos incriminatorios y exculpatorios separados', () => {
    assert.deepEqual(ejecutar(2), [
      { id: 1, nombre: 'Elisa Rivas', cantidad_incriminatorias: 1, peso_incriminatorio: 3,
        cantidad_presencias: 2, peso_exculpatorio: 4 },
      { id: 2, nombre: 'Bruno Torres', cantidad_incriminatorias: 4, peso_incriminatorio: 18,
        cantidad_presencias: 1, peso_exculpatorio: 5 },
      { id: 3, nombre: 'Carla Mendez', cantidad_incriminatorias: 4, peso_incriminatorio: 18,
        cantidad_presencias: 0, peso_exculpatorio: 2 },
      { id: 4, nombre: 'Diego Salas', cantidad_incriminatorias: 0, peso_incriminatorio: 0,
        cantidad_presencias: 1, peso_exculpatorio: 0 },
    ]);
  });

  test('C3 deduce el veredicto sin leer la columna de culpabilidad', () => {
    assert.deepEqual(ejecutar(3), [{ id: 3, nombre: 'Carla Mendez' }]);
    assert.doesNotMatch(consultas.get(3).sql, /es_culpable/);

    const culpable = conexion.prepare('SELECT id, nombre FROM sospechoso WHERE es_culpable = 1').get();
    assert.deepEqual(ejecutar(3), [culpable]);
  });

  describe('C3 solo descarta por una prueba exculpatoria a la hora del crimen', () => {
    const ID_CARLA = 3;

    function exculpatoriasDe(nombre) {
      return conexion
        .prepare(
          `SELECT ev.id, ev.hora_indicio
           FROM sospechoso_evidencia se
           JOIN sospechoso s ON s.id = se.sospechoso_id
           JOIN evidencia ev ON ev.id = se.evidencia_id
           WHERE s.nombre = ? AND se.tipo_vinculo = 'exculpa'`,
        )
        .all(nombre);
    }

    function agregarExculpatoriaDeCarla(horaIndicio) {
      const evidenciaId = conexion
        .prepare(
          `INSERT INTO evidencia (escena_id, tipo, descripcion, relevancia, hora_indicio)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(3, 'registro_digital', 'Registro de prueba que ubica a Carla en Cafe Bahia.', 4, horaIndicio)
        .lastInsertRowid;
      conexion
        .prepare(
          `INSERT INTO sospechoso_evidencia (sospechoso_id, evidencia_id, tipo_vinculo, peso, observaciones)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(ID_CARLA, evidenciaId, 'exculpa', 4, 'Vinculo exculpatorio de prueba.');
    }

    test('Bruno y Elisa tienen una prueba exculpatoria a las 21:30', () => {
      assert.deepEqual(exculpatoriasDe('Bruno Torres'), [{ id: 15, hora_indicio: '2026-11-09 21:30:00' }]);
      assert.deepEqual(exculpatoriasDe('Elisa Rivas'), [{ id: 17, hora_indicio: '2026-11-09 21:30:00' }]);
    });

    test('el ticket exculpatorio de Carla no tiene hora y no la descarta', () => {
      assert.deepEqual(exculpatoriasDe('Carla Mendez'), [{ id: 18, hora_indicio: null }]);
      assert.deepEqual(ejecutar(3), [{ id: ID_CARLA, nombre: 'Carla Mendez' }]);
    });

    test('una prueba exculpatoria a 5 minutos del crimen descarta a Carla', () => {
      agregarExculpatoriaDeCarla('2026-11-09 21:35:00');
      assert.deepEqual(ejecutar(3), []);
    });

    test('una prueba exculpatoria lejos de la hora del crimen no descarta a Carla', () => {
      agregarExculpatoriaDeCarla('2026-11-09 21:00:00');
      assert.deepEqual(ejecutar(3), [{ id: ID_CARLA, nombre: 'Carla Mendez' }]);
    });
  });

  test('C4 lista todas las evidencias con el nombre y el tipo de su lugar', () => {
    const filas = ejecutar(4);
    assert.equal(filas.length, conexion.prepare('SELECT COUNT(*) FROM evidencia').pluck().get());
    const lugares = new Set(filas.map((fila) => `${fila.lugar}|${fila.tipo_lugar}`));
    assert.deepEqual([...lugares], [
      'Archivo municipal|oficina',
      'Estacionamiento municipal|estacionamiento',
      'Cafe Bahia|cafeteria',
    ]);
  });

  test('C5 (anti-join) devuelve las evidencias sin sospechosos vinculados', () => {
    assert.deepEqual(ejecutar(5).map((fila) => fila.id), [9, 10]);
  });

  test('C6 (subconsulta escalar) devuelve las evidencias sobre la relevancia promedio', () => {
    const filas = ejecutar(6);
    const promedio = conexion.prepare('SELECT AVG(relevancia) FROM evidencia').pluck().get();
    assert.ok(filas.length > 0);
    assert.ok(filas.every((fila) => fila.relevancia > promedio));
    assert.equal(
      filas.length,
      conexion.prepare('SELECT COUNT(*) FROM evidencia WHERE relevancia > ?').pluck().get(promedio),
    );
  });

  test('C7 (GROUP BY + HAVING) devuelve a Bruno y a Carla', () => {
    const filas = ejecutar(7).sort((a, b) => a.nombre.localeCompare(b.nombre));
    assert.deepEqual(filas, [
      { nombre: 'Bruno Torres', total_incriminatorios: 4 },
      { nombre: 'Carla Mendez', total_incriminatorios: 4 },
    ]);
  });

  test('C8 descarta los interrogatorios sin contradicción', () => {
    const filas = ejecutar(8);
    assert.equal(filas.length, 4);
    assert.ok(filas.every((fila) => fila.contradiccion_detectada.trim() !== ''));
    const interrogatoriosTotales = conexion.prepare('SELECT COUNT(*) FROM interrogatorio').pluck().get();
    assert.ok(interrogatoriosTotales > filas.length);
  });

  test('C9 cuenta las pistas de cada escena con el nombre de su lugar', () => {
    assert.deepEqual(ejecutar(9), [
      { escena_id: 1, lugar: 'Archivo municipal', total_pistas: 11 },
      { escena_id: 2, lugar: 'Estacionamiento municipal', total_pistas: 4 },
      { escena_id: 3, lugar: 'Cafe Bahia', total_pistas: 3 },
    ]);
  });

  test('C10 ordena por peso incriminatorio y desempata por nombre', () => {
    assert.deepEqual(ejecutar(10), [
      { nombre: 'Bruno Torres', peso_incriminatorio: 18 },
      { nombre: 'Carla Mendez', peso_incriminatorio: 18 },
      { nombre: 'Elisa Rivas', peso_incriminatorio: 3 },
      { nombre: 'Diego Salas', peso_incriminatorio: 0 },
    ]);
  });
});

describe('Vista vista_matriz_evidencias', () => {
  let conexion;
  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  test('expone las columnas de la matriz y nunca la culpabilidad', () => {
    const columnas = conexion.pragma('table_info(vista_matriz_evidencias)').map((columna) => columna.name);
    assert.deepEqual(columnas, [
      'sospechoso_id',
      'caso_id',
      'nombre',
      'cantidad_incriminatorias',
      'peso_incriminatorio',
      'cantidad_presencias',
      'peso_exculpatorio',
    ]);
  });

  test('devuelve los números correctos para Carla y Bruno', () => {
    const fila = (nombre) =>
      conexion.prepare('SELECT * FROM vista_matriz_evidencias WHERE nombre = ?').get(nombre);

    assert.deepEqual(fila('Carla Mendez'), {
      sospechoso_id: 3, caso_id: 1, nombre: 'Carla Mendez', cantidad_incriminatorias: 4,
      peso_incriminatorio: 18, cantidad_presencias: 0, peso_exculpatorio: 2,
    });
    assert.deepEqual(fila('Bruno Torres'), {
      sospechoso_id: 2, caso_id: 1, nombre: 'Bruno Torres', cantidad_incriminatorias: 4,
      peso_incriminatorio: 18, cantidad_presencias: 1, peso_exculpatorio: 5,
    });
  });

  test('coincide con la matriz de la consulta C2', () => {
    const vista = conexion
      .prepare(
        `SELECT sospechoso_id AS id, nombre, cantidad_incriminatorias, peso_incriminatorio,
                cantidad_presencias, peso_exculpatorio
         FROM vista_matriz_evidencias ORDER BY sospechoso_id`,
      )
      .all();
    assert.deepEqual(vista, conexion.prepare(consultas.get(2).sql).all());
  });
});
