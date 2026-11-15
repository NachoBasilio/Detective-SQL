'use strict';

const { Router } = require('express');
const partidas = require('../controllers/partidas');

const rutas = Router();
rutas.post('/', partidas.crear);
rutas.get('/:id', partidas.obtener);
rutas.post('/:id/arrestos', partidas.arrestar);

module.exports = rutas;
