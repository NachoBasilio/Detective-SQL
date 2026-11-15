'use strict';

const { Router } = require('express');
const salud = require('../controllers/salud');

const rutas = Router();
rutas.get('/', salud.consultarEstado);

module.exports = rutas;
