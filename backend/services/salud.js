'use strict';

/** Ejecuta una consulta real para confirmar que la base responde. */
function verificarBase(baseDeDatos) {
  baseDeDatos.prepare('SELECT 1').pluck().get();
}

module.exports = { verificarBase };
