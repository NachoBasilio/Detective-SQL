'use strict';

// Ayudas compartidas por los controladores. Solo validan el formato de los
// datos que llegan por HTTP: las reglas del juego las impone SQLite.

const ENTERO_POSITIVO = /^[1-9]\d*$/;
const MENSAJE_ID_INVALIDO = 'El identificador debe ser un número entero positivo.';

/** Id recibido en la ruta como número, o null si no es un entero positivo. */
function leerIdDeRuta(texto) {
  if (!ENTERO_POSITIVO.test(texto)) return null;
  const id = Number(texto);
  return Number.isSafeInteger(id) ? id : null;
}

/** Id recibido en el cuerpo JSON, o null si no es un número entero positivo. */
function leerIdDelCuerpo(valor) {
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

function mensajeCampoInvalido(campo) {
  return `El campo ${campo} es obligatorio y debe ser un número entero positivo.`;
}

/**
 * Crea un controlador GET para rutas /:id: valida el id, ejecuta la consulta
 * del servicio y responde 404 cuando el servicio devuelve null.
 */
function responderConsultaPorId(consultar, mensajeInexistente) {
  return (req, res) => {
    const id = leerIdDeRuta(req.params.id);
    if (id === null) return res.status(400).json({ error: MENSAJE_ID_INVALIDO });

    const resultado = consultar(req.app.locals.baseDeDatos, id);
    if (resultado === null) return res.status(404).json({ error: mensajeInexistente });
    return res.json(resultado);
  };
}

/**
 * Busca la traducción HTTP de un error de SQLite. Cada traducción indica el
 * código del error, un fragmento de su mensaje, el estado HTTP y el mensaje
 * para el cliente. Devuelve undefined si el error no está previsto.
 */
function traducirErrorDeSqlite(error, traducciones) {
  return traducciones.find(
    ({ codigo, fragmento }) => error.code === codigo && String(error.message).includes(fragmento),
  );
}

module.exports = {
  MENSAJE_ID_INVALIDO,
  leerIdDeRuta,
  leerIdDelCuerpo,
  mensajeCampoInvalido,
  responderConsultaPorId,
  traducirErrorDeSqlite,
};
