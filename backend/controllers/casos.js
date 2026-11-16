'use strict';

const servicioCasos = require('../services/casos');
const { responderConsultaPorId } = require('./utilidades');

const CASO_INEXISTENTE = 'El caso no existe.';

function listar(req, res) {
  res.json(servicioCasos.listarCasos(req.app.locals.baseDeDatos));
}

module.exports = {
  listar,
  obtener: responderConsultaPorId(servicioCasos.obtenerCaso, CASO_INEXISTENTE),
  listarSospechosos: responderConsultaPorId(servicioCasos.listarSospechosos, CASO_INEXISTENTE),
  listarEscenas: responderConsultaPorId(servicioCasos.listarEscenas, CASO_INEXISTENTE),
  descartarCoartadas: responderConsultaPorId(servicioCasos.descartarCoartadas, CASO_INEXISTENTE),
  obtenerMatriz: responderConsultaPorId(servicioCasos.obtenerMatriz, CASO_INEXISTENTE),
};
