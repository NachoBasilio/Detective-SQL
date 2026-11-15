'use strict';

// Utilidades compartidas por los tests de la base de datos.

const fs = require('node:fs');
const assert = require('node:assert/strict');
const { RUTA_SCRIPT_SQL } = require('../../backend/database/crear-base');

const TABLAS_DEL_MODELO = [
  'acusacion',
  'caso',
  'escena',
  'evidencia',
  'interrogatorio',
  'lugar',
  'partida',
  'sospechoso',
  'sospechoso_evidencia',
];

const MARCADOR_CONSULTA = /^-- C(\d+):\s*(.+)$/;

/**
 * Lee database/detective.sql y devuelve las consultas numeradas, indexadas
 * por número. Cada consulta empieza después de su marcador "-- C<n>:" y
 * termina en la primera línea que cierra con ";". Las líneas de comentario
 * intermedias se descartan.
 */
function leerConsultasDelScript() {
  const lineas = fs.readFileSync(RUTA_SCRIPT_SQL, 'utf8').split(/\r?\n/);
  const consultas = new Map();

  lineas.forEach((linea, indice) => {
    const marcador = linea.match(MARCADOR_CONSULTA);
    if (!marcador) return;

    const sentencia = [];
    for (const siguiente of lineas.slice(indice + 1)) {
      if (siguiente.trim().startsWith('--')) continue;
      sentencia.push(siguiente);
      if (siguiente.trim().endsWith(';')) break;
    }

    consultas.set(Number(marcador[1]), {
      enunciado: marcador[2].trim(),
      sql: sentencia.join('\n').trim(),
    });
  });

  return consultas;
}

/** Cantidad de filas de cada tabla del modelo. */
function contarFilasPorTabla(conexion) {
  const conteo = {};
  for (const tabla of TABLAS_DEL_MODELO) {
    // El nombre de la tabla sale de una lista fija; no es entrada externa.
    conteo[tabla] = conexion.prepare(`SELECT COUNT(*) FROM ${tabla}`).pluck().get();
  }
  return conteo;
}

/**
 * Verifica que la operación falle con el error esperado y que ninguna tabla
 * haya ganado o perdido filas.
 */
function afirmarRechazoSinCambios(conexion, operacion, errorEsperado) {
  const filasAntes = contarFilasPorTabla(conexion);
  assert.throws(operacion, errorEsperado);
  assert.deepEqual(contarFilasPorTabla(conexion), filasAntes);
}

module.exports = {
  TABLAS_DEL_MODELO,
  leerConsultasDelScript,
  contarFilasPorTabla,
  afirmarRechazoSinCambios,
};
