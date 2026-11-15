// Punto de entrada: estado de la partida actual, navegación entre las cuatro
// pantallas con el hash de la URL (para que el botón "atrás" del navegador
// funcione) y recuperación de la partida al recargar la página.

import * as api from './api.js';
import * as expediente from './expediente.js';
import * as investigacion from './investigacion.js';
import * as acusacion from './acusacion.js';
import * as resultado from './resultado.js';
import { crear, crearSello, textoDeError } from './dom.js';

/**
 * Estado del juego en memoria. `arresto` es la respuesta del arresto: es el
 * único dato que contiene al culpable y solo existe después de acusar.
 */
const juego = { partida: null, arresto: null };

const PANTALLAS = {
  expediente: { modulo: expediente, titulo: 'Expediente', disponible: () => true },
  investigacion: { modulo: investigacion, titulo: 'Investigación', disponible: () => juego.partida !== null },
  acusacion: { modulo: acusacion, titulo: 'Acusación', disponible: () => juego.partida !== null },
  resultado: { modulo: resultado, titulo: 'Resultado', disponible: () => juego.arresto !== null },
};

const MOTIVOS_NO_DISPONIBLE = {
  investigacion: 'Para investigar, primero inicie una partida desde el expediente.',
  acusacion: 'Para acusar, primero inicie una partida desde el expediente.',
  resultado: 'El resultado aparece después de emitir una orden de arresto en una partida de esta sesión.',
};

/* Partida guardada: sessionStorage es solo una comodidad para sobrevivir a una
   recarga. Si el navegador lo bloquea, el juego sigue funcionando en memoria. */

const CLAVE_PARTIDA = 'detective-sql:partida';

function guardarPartida(id) {
  try {
    sessionStorage.setItem(CLAVE_PARTIDA, String(id));
  } catch {
    // Sin almacenamiento: la partida vive solo en memoria.
  }
}

function leerPartidaGuardada() {
  try {
    const valor = sessionStorage.getItem(CLAVE_PARTIDA);
    return valor !== null && /^[1-9]\d*$/.test(valor) ? Number(valor) : null;
  } catch {
    return null;
  }
}

function olvidarPartida() {
  try {
    sessionStorage.removeItem(CLAVE_PARTIDA);
  } catch {
    // Sin almacenamiento: no hay nada que borrar.
  }
  olvidarArresto();
}

/* Resultado guardado: la respuesta del arresto (la única que trae al culpable)
   se guarda en la sesión para volver a mostrar el resultado después de una
   recarga. GET /api/partidas/:id no devuelve acusado ni culpable a propósito,
   así que sin esta copia la pantalla de resultado no se puede reconstruir. */

const CLAVE_ARRESTO = 'detective-sql:arresto';
const ESTADOS_FINALES = ['ganada', 'perdida'];
const RESULTADOS = ['correcto', 'incorrecto'];

function guardarArresto(arresto) {
  try {
    sessionStorage.setItem(CLAVE_ARRESTO, JSON.stringify(arresto));
  } catch {
    // Sin almacenamiento: el resultado se ve hasta que se recargue la página.
  }
}

/**
 * Devuelve el arresto guardado solo si corresponde a la partida indicada y
 * tiene la forma que devuelve la API; en cualquier otro caso, null.
 */
function leerArrestoGuardado(partidaId) {
  try {
    const arresto = JSON.parse(sessionStorage.getItem(CLAVE_ARRESTO) ?? 'null');
    const valido =
      arresto?.partida?.id === partidaId &&
      ESTADOS_FINALES.includes(arresto.partida.estado) &&
      RESULTADOS.includes(arresto.resultado) &&
      typeof arresto.acusacion?.nombre === 'string' &&
      (arresto.culpable === null || typeof arresto.culpable?.nombre === 'string');
    return valido ? arresto : null;
  } catch {
    return null;
  }
}

function olvidarArresto() {
  try {
    sessionStorage.removeItem(CLAVE_ARRESTO);
  } catch {
    // Sin almacenamiento: no hay nada que borrar.
  }
}

/* Cabecera, avisos y navegación */

function mostrarAviso(texto) {
  document.getElementById('aviso').textContent = texto;
}

function actualizarCabecera() {
  const zona = document.getElementById('estado-partida');
  if (juego.partida === null) {
    zona.replaceChildren('Sin partida iniciada');
    return;
  }
  zona.replaceChildren(crear('span', { texto: `Partida n.º ${juego.partida.id}` }), crearSello(juego.partida.estado));
}

let pantallaActual = 'expediente';

function actualizarNavegacion() {
  for (const enlace of document.querySelectorAll('.navegacion [data-pantalla]')) {
    const nombre = enlace.dataset.pantalla;
    if (PANTALLAS[nombre].disponible()) {
      enlace.setAttribute('href', `#${nombre}`);
      enlace.removeAttribute('aria-disabled');
    } else {
      enlace.removeAttribute('href');
      enlace.setAttribute('aria-disabled', 'true');
    }
    if (nombre === pantallaActual) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
}

function nombreDesdeHash() {
  const nombre = location.hash.slice(1);
  return Object.hasOwn(PANTALLAS, nombre) ? nombre : null;
}

function mostrarPantalla(nombrePedido, { moverFoco }) {
  let nombre = nombrePedido;
  if (!PANTALLAS[nombre].disponible()) {
    // Un aviso previo (por ejemplo, "la partida ya terminó" al recargar) explica mejor qué pasó.
    if (document.getElementById('aviso').textContent === '') mostrarAviso(MOTIVOS_NO_DISPONIBLE[nombre]);
    nombre = 'expediente';
    history.replaceState(null, '', '#expediente');
  }

  pantallaActual = nombre;
  for (const seccion of document.querySelectorAll('main > section[data-pantalla]')) {
    seccion.hidden = seccion.dataset.pantalla !== nombre;
  }
  document.title = `${PANTALLAS[nombre].titulo} · Detective SQL`;
  actualizarNavegacion();

  const seccion = document.getElementById(`pantalla-${nombre}`);
  PANTALLAS[nombre].modulo.mostrar(seccion, contexto);
  if (moverFoco) seccion.querySelector('h1').focus();
}

function ir(nombre) {
  if (location.hash === `#${nombre}`) mostrarPantalla(nombre, { moverFoco: true });
  else location.hash = nombre;
}

/** Lo que las pantallas pueden leer y hacer sobre el estado del juego. */
const contexto = {
  juego,

  /** Crea la partida en la API; los errores llegan a la pantalla que llamó. */
  async iniciarPartida(casoId) {
    const partida = await api.crearPartida(casoId);
    juego.partida = partida;
    juego.arresto = null;
    olvidarArresto();
    guardarPartida(partida.id);
    actualizarCabecera();
    ir('investigacion');
  },

  /** Guarda la respuesta del arresto (con el veredicto que calculó SQLite) y muestra el resultado. */
  registrarArresto(arresto) {
    juego.arresto = arresto;
    juego.partida = { ...juego.partida, ...arresto.partida };
    guardarArresto(arresto);
    actualizarCabecera();
    ir('resultado');
  },
};

/**
 * Recupera la partida guardada; la API dice si sigue en curso. Si ya terminó,
 * el resultado se restaura desde la sesión solo cuando el estado guardado
 * coincide con el que tiene SQLite para esa partida.
 */
async function recuperarPartida() {
  const partidaId = leerPartidaGuardada();
  if (partidaId === null) return;
  try {
    const partida = await api.obtenerPartida(partidaId);
    if (partida.estado === 'en_curso') {
      juego.partida = partida;
      return;
    }
    const arresto = leerArrestoGuardado(partida.id);
    if (arresto !== null && arresto.partida.estado === partida.estado) {
      juego.partida = { ...partida, ...arresto.partida };
      juego.arresto = arresto;
      return;
    }
    olvidarPartida();
    mostrarAviso(`La partida n.º ${partida.id} ya terminó. Puede iniciar una partida nueva desde este expediente.`);
  } catch (error) {
    if (error?.estado === 400 || error?.estado === 404) olvidarPartida();
    mostrarAviso(`No se pudo recuperar la partida guardada: ${textoDeError(error)}`);
  }
}

window.addEventListener('hashchange', () => {
  // Un hash que no es una pantalla (por ejemplo, "Ir al contenido") no cambia de pantalla.
  const nombre = nombreDesdeHash();
  if (nombre === null) return;
  mostrarAviso('');
  mostrarPantalla(nombre, { moverFoco: true });
});

await recuperarPartida();
actualizarCabecera();
mostrarPantalla(nombreDesdeHash() ?? 'expediente', { moverFoco: false });
