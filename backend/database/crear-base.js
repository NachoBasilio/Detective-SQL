'use strict';

// Punto único de creación de la base: lo reutilizan el script db:init y todos
// los tests. El esquema solo nace de database/detective.sql.

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const RUTA_SCRIPT_SQL = path.join(__dirname, '..', '..', 'database', 'detective.sql');

/**
 * Verifica que cada caso con sospechosos tenga exactamente un culpable. El
 * índice único uq_un_culpable_por_caso solo impide un segundo culpable; que
 * exista uno se controla acá, al inicializar. Un caso sin sospechosos todavía
 * no se valida, para poder cargar casos de a un sospechoso.
 *
 * @param {import('better-sqlite3').Database} baseDeDatos
 * @throws {Error} Si algún caso no tiene exactamente un culpable.
 */
function validarCasosJugables(baseDeDatos) {
  const casosInvalidos = baseDeDatos
    .prepare(
      `SELECT c.id, c.titulo, SUM(s.es_culpable = 1) AS culpables
       FROM caso c
       JOIN sospechoso s ON s.caso_id = c.id
       GROUP BY c.id, c.titulo
       HAVING SUM(s.es_culpable = 1) <> 1
       ORDER BY c.id`,
    )
    .all();
  if (casosInvalidos.length === 0) return;

  const detalle = casosInvalidos
    .map((caso) => `Caso ${caso.id} ("${caso.titulo}"): ${caso.culpables} culpables.`)
    .join(' ');
  throw new Error(`Cada caso con sospechosos debe tener exactamente un culpable. ${detalle}`);
}

/**
 * Abre una conexión SQLite, activa las claves foráneas, ejecuta el script
 * completo de Detective SQL y valida que los casos sean jugables.
 *
 * @param {string} rutaBase Ruta del archivo de la base o ':memory:'.
 * @returns {import('better-sqlite3').Database} Conexión lista para jugar.
 */
function crearBase(rutaBase) {
  const conexion = new Database(rutaBase);
  try {
    conexion.pragma('foreign_keys = ON');
    conexion.exec(fs.readFileSync(RUTA_SCRIPT_SQL, 'utf8'));
    validarCasosJugables(conexion);
  } catch (error) {
    conexion.close();
    throw error;
  }
  return conexion;
}

module.exports = { crearBase, validarCasosJugables, RUTA_SCRIPT_SQL };
