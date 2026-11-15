'use strict';

const servicioEscenas = require('../services/escenas');
const { responderConsultaPorId } = require('./utilidades');

module.exports = {
  listarEvidencias: responderConsultaPorId(servicioEscenas.listarEvidencias, 'La escena no existe.'),
};
