'use strict';

// Punto de entrada de "npm start": abre la base del juego, levanta la API y
// sirve el frontend desde un único servidor local.
//   DB_PATH  ruta de la base (por defecto database/detective.db).
//   PORT     puerto HTTP (por defecto 3000).

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { crearApp } = require('./app');

const RUTA_BASE_PREDETERMINADA = path.join(__dirname, '..', 'database', 'detective.db');
const PUERTO_PREDETERMINADO = 3000;

/** Abre una base ya creada por db:init y activa las claves foráneas en la conexión. */
function abrirBase(rutaBase) {
  const conexion = new Database(rutaBase, { fileMustExist: true });
  conexion.pragma('foreign_keys = ON');
  return conexion;
}

function iniciarServidor() {
  const rutaBase = path.resolve(process.env.DB_PATH || RUTA_BASE_PREDETERMINADA);
  if (!fs.existsSync(rutaBase)) {
    console.error(`Error: no existe la base de datos ${rutaBase}.`);
    console.error('Crearla primero con "npm run db:init" y volver a ejecutar "npm start".');
    process.exitCode = 1;
    return;
  }

  const baseDeDatos = abrirBase(rutaBase);
  const puerto = Number(process.env.PORT) || PUERTO_PREDETERMINADO;

  const servidor = crearApp(baseDeDatos).listen(puerto, (error) => {
    if (error) {
      console.error(`Error: no se pudo escuchar en el puerto ${puerto}: ${error.message}`);
      baseDeDatos.close();
      process.exitCode = 1;
      return;
    }
    console.log(`Detective SQL disponible en http://localhost:${puerto}`);
  });

  // Cierre ordenado: deja de aceptar conexiones y después cierra la base.
  const cerrar = () => servidor.close(() => baseDeDatos.close());
  process.once('SIGINT', cerrar);
  process.once('SIGTERM', cerrar);
}

iniciarServidor();
