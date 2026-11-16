// Punto de entrada: estado de la partida actual, navegación entre las cuatro
// pantallas con el hash de la URL (para que el botón "atrás" del navegador
// funcione), recuperación de la partida al recargar la página y preferencias
// de idioma y tema.

import * as api from './api.js';
import * as expediente from './expediente.js';
import * as investigacion from './investigacion.js';
import * as acusacion from './acusacion.js';
import * as resultado from './resultado.js';
import { crear, crearSello, textoDeError } from './dom.js';
import { t } from './i18n/traductor.js';
import { iniciarPreferencias } from './preferencias.js';

/**
 * Estado del juego en memoria. `arresto` es la respuesta del arresto: es el
 * único dato que contiene al culpable y solo existe después de acusar.
 */
const juego = { partida: null, arresto: null };

const PANTALLAS = {
  expediente: { modulo: expediente, disponible: () => true },
  investigacion: { modulo: investigacion, disponible: () => juego.partida !== null },
  acusacion: { modulo: acusacion, disponible: () => juego.partida !== null },
  resultado: { modulo: resultado, disponible: () => juego.arresto !== null },
};

const MOTIVOS_NO_DISPONIBLE = {
  investigacion: 'avisos.investigacionNoDisponible',
  acusacion: 'avisos.acusacionNoDisponible',
  resultado: 'avisos.resultadoNoDisponible',
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

// El aviso se guarda como una función que arma el texto, para volver a
// escribirlo en el idioma nuevo si el jugador lo cambia.
let aviso = null;

function mostrarAviso(armarTexto) {
  aviso = armarTexto;
  dibujarAviso();
}

function borrarAviso() {
  mostrarAviso(null);
}

function dibujarAviso() {
  document.getElementById('aviso').textContent = aviso === null ? '' : aviso();
}

function actualizarCabecera() {
  const zona = document.getElementById('estado-partida');
  if (juego.partida === null) {
    zona.replaceChildren(t('cabecera.sinPartida'));
    return;
  }
  zona.replaceChildren(crear('span', { texto: t('comun.partida', { id: juego.partida.id }) }), crearSello(juego.partida.estado));
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
    if (aviso === null) mostrarAviso(() => t(MOTIVOS_NO_DISPONIBLE[nombre]));
    nombre = 'expediente';
    history.replaceState(null, '', '#expediente');
  }

  if (nombre !== pantallaActual) PANTALLAS[pantallaActual].modulo.alSalir?.();
  pantallaActual = nombre;
  for (const seccion of document.querySelectorAll('main > section[data-pantalla]')) {
    seccion.hidden = seccion.dataset.pantalla !== nombre;
  }
  document.title = t('documento.titulo', { pantalla: t(`pantallas.${nombre}`) });
  actualizarNavegacion();

  const seccion = document.getElementById(`pantalla-${nombre}`);
  PANTALLAS[nombre].modulo.mostrar(seccion, contexto);
  if (moverFoco) seccion.querySelector('h1').focus();
}

function ir(nombre) {
  if (location.hash === `#${nombre}`) mostrarPantalla(nombre, { moverFoco: true });
  else location.hash = nombre;
}

/** Deja la partida como actual: sin resultado, guardada para sobrevivir a una recarga y lista para investigar. */
function establecerPartida(partida) {
  juego.partida = partida;
  juego.arresto = null;
  olvidarArresto();
  guardarPartida(partida.id);
  actualizarCabecera();
  ir('investigacion');
}

/** Lo que las pantallas pueden leer y hacer sobre el estado del juego. */
const contexto = {
  juego,

  /** Crea la partida en la API; los errores llegan a la pantalla que llamó. */
  async iniciarPartida(casoId) {
    establecerPartida(await api.crearPartida(casoId));
  },

  /**
   * Retoma una partida de la lista de partidas en curso. La API confirma que
   * sigue en curso; si ya terminó, devuelve null y la partida actual no cambia.
   */
  async retomarPartida(partidaId) {
    const partida = await api.obtenerPartida(partidaId);
    if (partida.estado !== 'en_curso') return null;
    establecerPartida(partida);
    return partida;
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
 * Cambio de idioma: los datos del juego no se tocan. Se reescriben la
 * cabecera y el aviso, las pantallas descartan lo que ya dibujaron y la
 * pantalla actual se vuelve a dibujar sin mover el foco.
 */
function cambiarIdioma() {
  actualizarCabecera();
  dibujarAviso();
  for (const { modulo } of Object.values(PANTALLAS)) modulo.invalidar?.();
  mostrarPantalla(pantallaActual, { moverFoco: false });
}

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
    mostrarAviso(() => t('avisos.partidaTerminada', { id: partida.id }));
  } catch (error) {
    if (error?.estado === 400 || error?.estado === 404) olvidarPartida();
    mostrarAviso(() => t('avisos.partidaNoRecuperada', { detalle: textoDeError(error) }));
  }
}

window.addEventListener('hashchange', () => {
  // Un hash que no es una pantalla (por ejemplo, "Ir al contenido") no cambia de pantalla.
  const nombre = nombreDesdeHash();
  if (nombre === null) return;
  borrarAviso();
  mostrarPantalla(nombre, { moverFoco: true });
});

// Los textos fijos se traducen antes de esperar a la API.
iniciarPreferencias({ alCambiarIdioma: cambiarIdioma });
actualizarCabecera();
await recuperarPartida();
actualizarCabecera();
mostrarPantalla(nombreDesdeHash() ?? 'expediente', { moverFoco: false });
