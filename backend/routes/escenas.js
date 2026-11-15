'use strict';

const { Router } = require('express');
const escenas = require('../controllers/escenas');

const rutas = Router();
rutas.get('/:id/evidencias', escenas.listarEvidencias);

module.exports = rutas;
