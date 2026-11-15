'use strict';

const servicioSalud = require('../services/salud');

function consultarEstado(req, res) {
  servicioSalud.verificarBase(req.app.locals.baseDeDatos);
  res.json({ estado: 'ok' });
}

module.exports = { consultarEstado };
