'use strict';

const { Router } = require('express');
const casos = require('../controllers/casos');

const rutas = Router();
rutas.get('/', casos.listar);
rutas.get('/:id', casos.obtener);
rutas.get('/:id/sospechosos', casos.listarSospechosos);
rutas.get('/:id/escenas', casos.listarEscenas);
rutas.get('/:id/investigacion/coartadas', casos.descartarCoartadas);
rutas.get('/:id/investigacion/matriz', casos.obtenerMatriz);

module.exports = rutas;
