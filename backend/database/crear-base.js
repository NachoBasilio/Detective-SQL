'use strict';

// Punto único de creación de la base: lo reutilizan el script db:init y todos
// los tests. El esquema solo nace de database/detective.sql.

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const RUTA_SCRIPT_SQL = path.join(__dirname, '..', '..', 'database', 'detective.sql');

/**
 * Abre una conexión SQLite, activa las claves foráneas y ejecuta el script
 * completo de Detective SQL.
 *
 * @param {string} rutaBase Ruta del archivo de la base o ':memory:'.
 * @returns {import('better-sqlite3').Database} Conexión lista para jugar.
 */
function crearBase(rutaBase) {
  const conexion = new Database(rutaBase);
  try {
    conexion.pragma('foreign_keys = ON');
    conexion.exec(fs.readFileSync(RUTA_SCRIPT_SQL, 'utf8'));
  } catch (error) {
    conexion.close();
    throw error;
  }
  return conexion;
}

module.exports = { crearBase, RUTA_SCRIPT_SQL };
