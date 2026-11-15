'use strict';

// Crea la base SQLite del juego ejecutando database/detective.sql.
//   npm run db:init   crea la base; falla si ya existe.
//   npm run db:reset  OPERACIÓN DESTRUCTIVA: borra la base y la vuelve a crear.
// La ruta por defecto es database/detective.db; se puede cambiar con DB_PATH.

const fs = require('node:fs');
const path = require('node:path');
const { crearBase } = require('../backend/database/crear-base');

const RUTA_BASE_PREDETERMINADA = path.join(__dirname, '..', 'database', 'detective.db');
const ARCHIVOS_AUXILIARES_SQLITE = ['-journal', '-wal', '-shm'];

function borrarBase(rutaBase) {
  for (const sufijo of ['', ...ARCHIVOS_AUXILIARES_SQLITE]) {
    fs.rmSync(`${rutaBase}${sufijo}`, { force: true });
  }
}

function inicializarBase() {
  const rutaBase = path.resolve(process.env.DB_PATH || RUTA_BASE_PREDETERMINADA);
  const reiniciar = process.argv.includes('--reset');

  if (reiniciar) {
    console.warn(`ATENCIÓN: operación destructiva. Se borra ${rutaBase} con todas sus partidas y se vuelve a crear.`);
    borrarBase(rutaBase);
  } else if (fs.existsSync(rutaBase)) {
    console.error(`Error: la base ${rutaBase} ya existe y no se sobrescribe.`);
    console.error('Para borrarla y crearla de nuevo, ejecutar "npm run db:reset" (operación destructiva).');
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(rutaBase), { recursive: true });

  try {
    crearBase(rutaBase).close();
  } catch (error) {
    // Una base a medio crear impediría el próximo db:init: se elimina.
    borrarBase(rutaBase);
    console.error(`Error: no se pudo ejecutar database/detective.sql: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Base creada en ${rutaBase}.`);
}

inicializarBase();
