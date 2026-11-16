'use strict';

const { Router } = require('express');
const sospechosos = require('../controllers/sospechosos');

const rutas = Router();
rutas.get('/:id/interrogatorios', sospechosos.listarInterrogatorios);

module.exports = rutas;
