'use strict';

const servicioSospechosos = require('../services/sospechosos');
const { responderConsultaPorId } = require('./utilidades');

module.exports = {
  listarInterrogatorios: responderConsultaPorId(servicioSospechosos.listarInterrogatorios, 'El sospechoso no existe.'),
};
