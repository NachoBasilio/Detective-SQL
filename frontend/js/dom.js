// Ayudas de DOM compartidas por las pantallas.
// Todo texto que llega de la API se inserta como nodo de texto (textContent o
// append de un string): nunca con innerHTML. Los textos de la interfaz salen
// del catálogo de i18n/; el formato de fechas, de i18n/traductor.js.

import { t, traducirEnum, traducirErrorDeApi } from './i18n/traductor.js';

let contadorIds = 0;

/** Id único para enlazar elementos con aria-labelledby o aria-describedby. */
export function nuevoId(prefijo) {
  contadorIds += 1;
  return `${prefijo}-${contadorIds}`;
}

/**
 * Crea un elemento. Los hijos que no son nodos se agregan como texto.
 *
 * @param {string} etiqueta
 * @param {{ clase?: string, texto?: string | number, atributos?: Record<string, string | number> }} [opciones]
 * @param {Array<Node | string | number | null | undefined | false>} [hijos]
 */
export function crear(etiqueta, { clase, texto, atributos } = {}, hijos = []) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined && texto !== null) elemento.textContent = String(texto);
  for (const [nombre, valor] of Object.entries(atributos ?? {})) {
    elemento.setAttribute(nombre, String(valor));
  }
  for (const hijo of hijos) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    elemento.append(hijo instanceof Node ? hijo : String(hijo));
  }
  return elemento;
}

/* Estados de carga, vacío y error */

export function mensajeDeCarga(texto) {
  return crear('p', { clase: 'estado', texto, atributos: { role: 'status' } });
}

export function mensajeVacio(texto) {
  return crear('p', { clase: 'estado', texto });
}

/**
 * Mensaje para el jugador en el idioma activo: el error propio de la interfaz
 * (con clave del catálogo), el que devolvió la API (traducido si se conoce) o
 * uno genérico si el error ocurrió en el código de la interfaz.
 */
export function textoDeError(error) {
  if (typeof error?.clave === 'string') return t(error.clave, error.parametros);
  if (error?.name === 'ErrorDeApi') return traducirErrorDeApi(error.message);
  console.error(error);
  return t('comun.errorInesperado');
}

/**
 * Bloque de error con el mensaje de la API. Puede ofrecer un botón para
 * reintentar la carga o un enlace que indica cómo seguir.
 *
 * @param {unknown} error
 * @param {{ reintentar?: () => void, enlace?: { texto: string, href: string, alActivar?: () => void } }} [salida]
 */
export function mensajeDeError(error, { reintentar, enlace } = {}) {
  const bloque = crear('div', { clase: 'alerta', atributos: { role: 'alert' } }, [
    crear('p', { texto: textoDeError(error) }),
  ]);
  if (reintentar) {
    const boton = crear('button', { clase: 'boton boton--secundario', texto: t('comun.reintentar'), atributos: { type: 'button' } });
    boton.addEventListener('click', reintentar);
    bloque.append(boton);
  }
  if (enlace) {
    const vinculo = crear('a', { texto: enlace.texto, atributos: { href: enlace.href } });
    if (enlace.alActivar) vinculo.addEventListener('click', enlace.alActivar);
    bloque.append(vinculo);
  }
  return bloque;
}

/**
 * Deshabilita los botones mientras se espera a la API, para que la solicitud
 * no se envíe dos veces, y los restaura al terminar, con éxito o con error.
 * Se conservan los nodos originales del botón (por ejemplo, un texto solo
 * para lectores de pantalla).
 */
export async function mientrasEspera(boton, textoEspera, accion, otrosBotones = []) {
  const contenidoOriginal = [...boton.childNodes];
  const botones = [boton, ...otrosBotones];
  for (const cada of botones) cada.disabled = true;
  boton.setAttribute('aria-busy', 'true');
  boton.textContent = textoEspera;
  try {
    return await accion();
  } finally {
    for (const cada of botones) cada.disabled = false;
    boton.removeAttribute('aria-busy');
    boton.replaceChildren(...contenidoOriginal);
  }
}

/* Componentes */

/** Lista de definiciones: cada fila es [rótulo, valor, esDato]. */
export function crearFicha(filas, clase = '') {
  return crear('dl', { clase: `ficha ${clase}`.trim() }, filas.map(([rotulo, valor, esDato = false]) =>
    crear('div', {}, [
      crear('dt', { texto: rotulo }),
      crear('dd', { clase: esDato ? 'dato' : undefined }, [valor]),
    ])));
}

/**
 * Tabla accesible dentro de un contenedor con desplazamiento horizontal
 * propio, para que la página nunca se desplace de costado. La primera celda
 * de cada fila es su encabezado.
 *
 * @param {{ titulo: string, columnas: Array<{ titulo: string, clase?: string }>, filas: Array<Array<Node | string | number>>, clase?: string }} datos
 */
export function crearTabla({ titulo, columnas, filas, clase = '' }) {
  const encabezado = crear('tr', {}, columnas.map((columna) =>
    crear('th', { clase: columna.clase, texto: columna.titulo, atributos: { scope: 'col' } })));
  const cuerpo = filas.map((celdas) => crear('tr', {}, celdas.map((celda, indice) => (indice === 0
    ? crear('th', { clase: columnas[indice].clase, atributos: { scope: 'row' } }, [celda])
    : crear('td', { clase: columnas[indice].clase }, [celda])))));

  const tabla = crear('table', { clase: `tabla ${clase}`.trim() }, [
    crear('caption', { clase: 'solo-lectores', texto: titulo }),
    crear('thead', {}, [encabezado]),
    crear('tbody', {}, cuerpo),
  ]);
  return crear('div', {
    clase: 'tabla-contenedor',
    atributos: { role: 'region', 'aria-label': titulo, tabindex: 0 },
  }, [tabla]);
}

const CLASES_DE_SELLO = new Map([
  ['en_curso', 'sello--en-curso'],
  ['ganada', 'sello--ganada'],
  ['perdida', 'sello--perdida'],
]);

/** Sello con el estado de la partida tal como lo devolvió la API, en el idioma activo. */
export function crearSello(estado, claseExtra = '') {
  const clases = ['sello', CLASES_DE_SELLO.get(estado), claseExtra].filter(Boolean).join(' ');
  return crear('span', { clase: clases, texto: traducirEnum('estadoPartida', estado) });
}
