'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { crearBase } = require('../../backend/database/crear-base');
const { leerConsultasDelScript, insertarEvidencia, vincularSospechoso } = require('../helpers/base-de-datos');

const consultas = leerConsultasDelScript();

const ID_ELISA = 1;
const ID_BRUNO = 2;
const ID_CARLA = 3;
const ID_DIEGO = 4;
const ESCENA_ARCHIVO = 1;
const ESCENA_ESTACIONAMIENTO = 2;
const ESCENA_CAFE = 3;
const LUGAR_ARCHIVO = 1;
const LUGAR_ESTACIONAMIENTO = 2;
const LUGAR_CAFE = 3;
const CARLA = { id: ID_CARLA, nombre: 'Carla Mendez' };

// Hora del crimen: hora_suceso de la escena principal del caso 1.
const HORA_DEL_CRIMEN = '2026-11-09 21:30:00';

/** Hora con formato de SQLite desplazada una cantidad de segundos respecto del crimen. */
function horaRelativaAlCrimen(segundos) {
  const instante = new Date(Date.parse(`${HORA_DEL_CRIMEN.replace(' ', 'T')}Z`) + segundos * 1000);
  return instante.toISOString().replace('T', ' ').slice(0, 19);
}

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

  describe('C3 solo descarta por una prueba exculpatoria que acredita otro lugar a la hora del crimen', () => {
    function exculpatoriasDe(nombre) {
      return conexion
        .prepare(
          `SELECT ev.id, l.nombre AS lugar_acreditado, ev.hora_indicio
           FROM sospechoso_evidencia se
           JOIN sospechoso s ON s.id = se.sospechoso_id
           JOIN evidencia ev ON ev.id = se.evidencia_id
           LEFT JOIN lugar l ON l.id = ev.lugar_acreditado_id
           WHERE s.nombre = ? AND se.tipo_vinculo = 'exculpa'`,
        )
        .all(nombre);
    }

    /** Exculpatoria de Carla hallada en Cafe Bahia; por defecto acredita ese mismo lugar. */
    function agregarExculpatoriaDeCarla(horaIndicio, lugarAcreditadoId = LUGAR_CAFE) {
      const evidenciaId = insertarEvidencia(conexion, {
        escenaId: ESCENA_CAFE, horaIndicio, lugarAcreditadoId,
        descripcion: 'Registro de prueba que ubica a Carla fuera del archivo.',
      });
      vincularSospechoso(conexion, ID_CARLA, evidenciaId, 'exculpa', 4);
    }

    /** Registro digital incriminatorio en la escena principal, cerca de la hora del crimen. */
    function agregarRegistroIncriminatorio(sospechosoId, horaIndicio = '2026-11-09 21:28:00') {
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_ARCHIVO, horaIndicio, lugarAcreditadoId: LUGAR_ARCHIVO });
      vincularSospechoso(conexion, sospechosoId, evidenciaId, 'incrimina', 5);
    }

    function quitarLugarAcreditado(evidenciaId) {
      conexion.prepare('UPDATE evidencia SET lugar_acreditado_id = NULL WHERE id = ?').run(evidenciaId);
    }

    test('Bruno y Elisa tienen una exculpatoria que los ubica en otro lugar a las 21:30', () => {
      assert.deepEqual(exculpatoriasDe('Bruno Torres'), [
        { id: 15, lugar_acreditado: 'Cafe Bahia', hora_indicio: '2026-11-09 21:30:00' },
      ]);
      assert.deepEqual(exculpatoriasDe('Elisa Rivas'), [
        { id: 17, lugar_acreditado: 'Estacionamiento municipal', hora_indicio: '2026-11-09 21:30:00' },
      ]);
    });

    test('Bruno queda descartado por la cámara de Cafe Bahia aunque cumpla las condiciones incriminatorias', () => {
      agregarRegistroIncriminatorio(ID_BRUNO);
      assert.deepEqual(ejecutar(3), [CARLA]);

      // Sin el lugar acreditado, la misma cámara ya no lo descarta.
      quitarLugarAcreditado(15);
      assert.deepEqual(ejecutar(3).map((fila) => fila.id).sort(), [ID_BRUNO, ID_CARLA]);
    });

    test('Elisa queda descartada por la cámara del estacionamiento aunque cumpla las condiciones incriminatorias', () => {
      agregarRegistroIncriminatorio(ID_ELISA);
      assert.deepEqual(ejecutar(3), [CARLA]);

      quitarLugarAcreditado(17);
      assert.deepEqual(ejecutar(3).map((fila) => fila.id).sort(), [ID_ELISA, ID_CARLA]);
    });

    test('el ticket de Carla acredita Restaurante Central a las 21:12 y no la descarta', () => {
      assert.deepEqual(exculpatoriasDe('Carla Mendez'), [
        { id: 18, lugar_acreditado: 'Restaurante Central', hora_indicio: '2026-11-09 21:12:00' },
      ]);
      assert.deepEqual(ejecutar(3), [CARLA]);
    });

    test('una prueba exculpatoria en otro lugar a 5 minutos del crimen descarta a Carla', () => {
      agregarExculpatoriaDeCarla('2026-11-09 21:35:00');
      assert.deepEqual(ejecutar(3), []);
    });

    test('una prueba exculpatoria lejos de la hora del crimen no descarta a Carla', () => {
      agregarExculpatoriaDeCarla('2026-11-09 21:00:00');
      assert.deepEqual(ejecutar(3), [CARLA]);
    });

    test('una exculpatoria con hora pero sin lugar acreditado no descarta a Carla', () => {
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_CAFE, horaIndicio: HORA_DEL_CRIMEN });
      vincularSospechoso(conexion, ID_CARLA, evidenciaId, 'exculpa', 5);
      assert.deepEqual(ejecutar(3), [CARLA]);
    });

    test('una exculpatoria que acredita la propia escena principal no descarta a Carla', () => {
      agregarExculpatoriaDeCarla(HORA_DEL_CRIMEN, LUGAR_ARCHIVO);
      assert.deepEqual(ejecutar(3), [CARLA]);
    });

    test('una exculpatoria de peso máximo sin lugar ni hora no descarta a Carla', () => {
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_CAFE, tipo: 'objeto', lugarAcreditadoId: null });
      vincularSospechoso(conexion, ID_CARLA, evidenciaId, 'exculpa', 5);
      assert.deepEqual(ejecutar(3), [CARLA]);
    });
  });

  describe('C3 compara horarios en segundos enteros: tolerancia de 600 segundos', () => {
    const CASOS_BORDE = [
      { segundos: -601, dentro: false },
      { segundos: -600, dentro: true },
      { segundos: -599, dentro: true },
      { segundos: 599, dentro: true },
      { segundos: 600, dentro: true },
      { segundos: 601, dentro: false },
    ];

    /** Deja a Bruno sin su exculpatoria para aislar la condición incriminatoria. */
    function quitarExculpatoriaDeBruno() {
      conexion.prepare('DELETE FROM sospechoso_evidencia WHERE sospechoso_id = ? AND evidencia_id = ?').run(ID_BRUNO, 15);
    }

    function agregarRegistroDeBruno(horaIndicio) {
      quitarExculpatoriaDeBruno();
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_ARCHIVO, horaIndicio, lugarAcreditadoId: LUGAR_ARCHIVO });
      vincularSospechoso(conexion, ID_BRUNO, evidenciaId, 'incrimina', 5);
    }

    function agregarExculpatoriaDeCarla(horaIndicio) {
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_CAFE, horaIndicio, lugarAcreditadoId: LUGAR_CAFE });
      vincularSospechoso(conexion, ID_CARLA, evidenciaId, 'exculpa', 4);
    }

    function idsDelVeredicto() {
      return ejecutar(3).map((fila) => fila.id).sort();
    }

    test('C3 usa segundos enteros y no julianday()', () => {
      assert.equal(conexion.prepare('SELECT hora_suceso FROM escena WHERE es_principal = 1').pluck().get(), HORA_DEL_CRIMEN);
      assert.doesNotMatch(consultas.get(3).sql, /julianday/i);
      assert.match(consultas.get(3).sql, /strftime\('%s'/);
      assert.match(consultas.get(3).sql, /<= 600/);
    });

    for (const { segundos, dentro } of CASOS_BORDE) {
      test(`un registro incriminatorio a ${segundos} s del crimen queda ${dentro ? 'incluido' : 'excluido'}`, () => {
        agregarRegistroDeBruno(horaRelativaAlCrimen(segundos));
        assert.deepEqual(idsDelVeredicto(), dentro ? [ID_BRUNO, ID_CARLA] : [ID_CARLA]);
      });

      test(`una exculpatoria a ${segundos} s del crimen ${dentro ? 'descarta' : 'no descarta'} a Carla`, () => {
        agregarExculpatoriaDeCarla(horaRelativaAlCrimen(segundos));
        assert.deepEqual(idsDelVeredicto(), dentro ? [] : [ID_CARLA]);
      });
    }

    test('un registro incriminatorio sin hora no produce una coincidencia falsa', () => {
      agregarRegistroDeBruno(null);
      assert.deepEqual(idsDelVeredicto(), [ID_CARLA]);
    });

    test('una exculpatoria sin hora no produce una coincidencia falsa', () => {
      agregarExculpatoriaDeCarla(null);
      assert.deepEqual(idsDelVeredicto(), [ID_CARLA]);
    });
  });

  describe('C1 usa el lugar acreditado por la evidencia, no el de la escena del hallazgo', () => {
    function lugaresDeLaEvidencia(evidenciaId) {
      return conexion
        .prepare(
          `SELECT hallazgo.nombre AS lugar_hallazgo, acreditado.nombre AS lugar_acreditado, ev.hora_indicio
           FROM evidencia ev
           JOIN escena ec ON ec.id = ev.escena_id
           JOIN lugar hallazgo ON hallazgo.id = ec.lugar_id
           LEFT JOIN lugar acreditado ON acreditado.id = ev.lugar_acreditado_id
           WHERE ev.id = ?`,
        )
        .get(evidenciaId);
    }

    test('el ticket se encontró en el archivo pero acredita Restaurante Central a las 21:12', () => {
      assert.deepEqual(lugaresDeLaEvidencia(18), {
        lugar_hallazgo: 'Archivo municipal',
        lugar_acreditado: 'Restaurante Central',
        hora_indicio: '2026-11-09 21:12:00',
      });
    });

    test('el ticket no demuestra presencia en el archivo: C1 solo informa la credencial de Carla', () => {
      const filasDeCarla = ejecutar(1).filter((fila) => fila.id === ID_CARLA);
      assert.deepEqual(filasDeCarla, [
        { id: ID_CARLA, nombre: 'Carla Mendez', lugar_declarado: 'Restaurante Central',
          lugar_observado: 'Archivo municipal', hora_indicio: '2026-11-09 21:29:00' },
      ]);
    });

    test('una prueba sin lugar acreditado no genera una contradicción espacial', () => {
      const antes = ejecutar(1);
      const evidenciaId = insertarEvidencia(conexion, { escenaId: ESCENA_ESTACIONAMIENTO, horaIndicio: '2026-11-09 21:45:00' });
      vincularSospechoso(conexion, ID_DIEGO, evidenciaId, 'presencia', 2);
      assert.deepEqual(ejecutar(1), antes);
    });

    test('el lugar observado sale del lugar acreditado aunque la prueba se haya hallado en otra escena', () => {
      const evidenciaId = insertarEvidencia(conexion, {
        escenaId: ESCENA_CAFE, horaIndicio: '2026-11-09 21:45:00', lugarAcreditadoId: LUGAR_ESTACIONAMIENTO,
      });
      vincularSospechoso(conexion, ID_DIEGO, evidenciaId, 'presencia', 2);

      const filasDeDiego = ejecutar(1).filter((fila) => fila.id === ID_DIEGO);
      assert.deepEqual(filasDeDiego.map((fila) => [fila.lugar_observado, fila.hora_indicio]), [
        ['Estacionamiento municipal', '2026-11-09 21:22:00'],
        ['Estacionamiento municipal', '2026-11-09 21:45:00'],
      ]);
    });

    test('C1 compara lugar_acreditado_id con el lugar de la coartada y conserva un JOIN de tres o más tablas', () => {
      const sql = consultas.get(1).sql;
      assert.match(sql, /lugar_acreditado_id/);
      assert.match(sql, /lugar_coartada_id/);
      assert.ok((sql.match(/\bJOIN\b/gi) ?? []).length >= 3);
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

describe('C3: el registro digital que corrobora la presencia acredita el lugar del crimen', () => {
  const LUGAR_RESTAURANTE = 6;
  let conexion;

  beforeEach(() => {
    conexion = crearBase(':memory:');
  });
  afterEach(() => conexion.close());

  function veredicto() {
    return conexion.prepare(consultas.get(3).sql).all().map((fila) => fila.id);
  }

  function cambiarLugarDelAccesoDeCarla(lugarId) {
    conexion.prepare('UPDATE evidencia SET lugar_acreditado_id = ? WHERE id = 2').run(lugarId);
  }

  test('el acceso con credencial de Carla acredita el archivo, lugar del crimen', () => {
    assert.equal(conexion.prepare('SELECT lugar_acreditado_id FROM evidencia WHERE id = 2').pluck().get(), LUGAR_ARCHIVO);
    assert.deepEqual(veredicto(), [ID_CARLA]);
  });

  test('si el registro digital acredita otro lugar, no corrobora la presencia y C3 no devuelve a nadie', () => {
    assert.equal(conexion.prepare('SELECT nombre FROM lugar WHERE id = ?').pluck().get(LUGAR_RESTAURANTE), 'Restaurante Central');
    cambiarLugarDelAccesoDeCarla(LUGAR_RESTAURANTE);
    assert.deepEqual(veredicto(), []);
  });

  test('si el registro digital no acredita ningún lugar, tampoco corrobora la presencia', () => {
    cambiarLugarDelAccesoDeCarla(null);
    assert.deepEqual(veredicto(), []);
  });
});
