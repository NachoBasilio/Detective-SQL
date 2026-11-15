'use strict';

const servicioPartidas = require('../services/partidas');
const {
  MENSAJE_ID_INVALIDO,
  leerIdDeRuta,
  leerIdDelCuerpo,
  mensajeCampoInvalido,
  responderConsultaPorId,
  traducirErrorDeSqlite,
} = require('./utilidades');

const PARTIDA_INEXISTENTE = 'La partida no existe.';
const PARTIDA_TERMINADA = 'La partida ya terminó: solo se permite un arresto por partida.';

// Errores de SQLite previstos al crear una partida.
const ERRORES_AL_CREAR = [
  { codigo: 'SQLITE_CONSTRAINT_FOREIGNKEY', fragmento: 'FOREIGN KEY constraint failed', estado: 404, mensaje: 'El caso no existe.' },
];

// Errores de SQLite previstos al arrestar. La partida ya se confirmó dentro de
// la transacción, por lo que una clave foránea fallida solo puede ser la del
// sospechoso.
const ERRORES_AL_ARRESTAR = [
  { codigo: 'SQLITE_CONSTRAINT_TRIGGER', fragmento: 'No se puede acusar en una partida terminada', estado: 409, mensaje: PARTIDA_TERMINADA },
  { codigo: 'SQLITE_CONSTRAINT_UNIQUE', fragmento: 'acusacion.partida_id', estado: 409, mensaje: PARTIDA_TERMINADA },
  { codigo: 'SQLITE_CONSTRAINT_TRIGGER', fragmento: 'El sospechoso no pertenece al caso de la partida', estado: 400, mensaje: 'El sospechoso no pertenece al caso de la partida.' },
  { codigo: 'SQLITE_CONSTRAINT_FOREIGNKEY', fragmento: 'FOREIGN KEY constraint failed', estado: 404, mensaje: 'El sospechoso no existe.' },
];

/** Ejecuta la operación y traduce a HTTP los errores de SQLite previstos; el resto llega al middleware de errores. */
function responderOperacion(res, operacion, traducciones, responder) {
  let resultado;
  try {
    resultado = operacion();
  } catch (error) {
    const traduccion = traducirErrorDeSqlite(error, traducciones);
    if (traduccion === undefined) throw error;
    return res.status(traduccion.estado).json({ error: traduccion.mensaje });
  }
  return responder(resultado);
}

function crear(req, res) {
  const casoId = leerIdDelCuerpo(req.body?.casoId);
  if (casoId === null) return res.status(400).json({ error: mensajeCampoInvalido('casoId') });

  const baseDeDatos = req.app.locals.baseDeDatos;
  return responderOperacion(
    res,
    () => servicioPartidas.crearPartida(baseDeDatos, casoId),
    ERRORES_AL_CREAR,
    (partida) => res.status(201).json(partida),
  );
}

function arrestar(req, res) {
  const partidaId = leerIdDeRuta(req.params.id);
  if (partidaId === null) return res.status(400).json({ error: MENSAJE_ID_INVALIDO });
  const sospechosoId = leerIdDelCuerpo(req.body?.sospechosoId);
  if (sospechosoId === null) return res.status(400).json({ error: mensajeCampoInvalido('sospechosoId') });

  const baseDeDatos = req.app.locals.baseDeDatos;
  return responderOperacion(
    res,
    () => servicioPartidas.registrarArresto(baseDeDatos, partidaId, sospechosoId),
    ERRORES_AL_ARRESTAR,
    (arresto) => (arresto === null
      ? res.status(404).json({ error: PARTIDA_INEXISTENTE })
      : res.status(201).json(arresto)),
  );
}

module.exports = {
  crear,
  obtener: responderConsultaPorId(servicioPartidas.obtenerPartida, PARTIDA_INEXISTENTE),
  arrestar,
};
