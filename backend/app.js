'use strict';

// Aplicación Express de Detective SQL: API REST bajo /api y archivos
// estáticos del frontend, servidos por el mismo servidor.

const path = require('node:path');
const express = require('express');
const rutasSalud = require('./routes/salud');
const rutasCasos = require('./routes/casos');
const rutasEscenas = require('./routes/escenas');
const rutasSospechosos = require('./routes/sospechosos');
const rutasPartidas = require('./routes/partidas');

const CARPETA_FRONTEND = path.join(__dirname, '..', 'frontend');

/**
 * Las respuestas de error nunca incluyen texto de SQL: los errores no
 * previstos se registran en el servidor y el cliente recibe un mensaje
 * genérico.
 */
function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un JSON válido.' });
  }
  const estado = error.status ?? error.statusCode;
  if (estado >= 400 && estado < 500) {
    return res.status(estado).json({ error: 'La solicitud no es válida.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

/**
 * Crea la aplicación sobre una conexión better-sqlite3 abierta. Los tests le
 * pasan una base en memoria; server.js, la base del juego.
 *
 * @param {import('better-sqlite3').Database} baseDeDatos
 */
function crearApp(baseDeDatos) {
  if (baseDeDatos.pragma('foreign_keys', { simple: true }) !== 1) {
    throw new Error('La conexión a SQLite debe tener activadas las claves foráneas (PRAGMA foreign_keys = ON).');
  }

  const app = express();
  app.disable('x-powered-by');
  app.locals.baseDeDatos = baseDeDatos;

  app.use(express.json());
  app.use('/api/health', rutasSalud);
  app.use('/api/casos', rutasCasos);
  app.use('/api/escenas', rutasEscenas);
  app.use('/api/sospechosos', rutasSospechosos);
  app.use('/api/partidas', rutasPartidas);
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'La ruta solicitada no existe en la API.' });
  });

  app.use(express.static(CARPETA_FRONTEND));
  app.use(manejarErrores);

  return app;
}

module.exports = { crearApp };
