// Ayudas de DOM y de formato compartidas por las pantallas.
// Todo texto que llega de la API se inserta como nodo de texto (textContent o
// append de un string): nunca con innerHTML.

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

/** Mensaje para el jugador: el que devolvió la API, o uno genérico si el error ocurrió en la interfaz. */
export function textoDeError(error) {
  if (error?.name === 'ErrorDeApi') return error.message;
  console.error(error);
  return 'Ocurrió un error inesperado en la interfaz. Recargue la página para continuar.';
}

/**
 * Bloque de error con el mensaje de la API. Puede ofrecer un botón para
 * reintentar la carga o un enlace que indica cómo seguir.
 *
 * @param {unknown} error
 * @param {{ reintentar?: () => void, enlace?: { texto: string, href: string } }} [salida]
 */
export function mensajeDeError(error, { reintentar, enlace } = {}) {
  const bloque = crear('div', { clase: 'alerta', atributos: { role: 'alert' } }, [
    crear('p', { texto: textoDeError(error) }),
  ]);
  if (reintentar) {
    const boton = crear('button', { clase: 'boton boton--secundario', texto: 'Reintentar', atributos: { type: 'button' } });
    boton.addEventListener('click', reintentar);
    bloque.append(boton);
  }
  if (enlace) bloque.append(crear('a', { texto: enlace.texto, atributos: { href: enlace.href } }));
  return bloque;
}

/**
 * Deshabilita los botones mientras se espera a la API, para que la solicitud
 * no se envíe dos veces, y los restaura al terminar, con éxito o con error.
 */
export async function mientrasEspera(boton, textoEspera, accion, otrosBotones = []) {
  const textoOriginal = boton.textContent;
  const botones = [boton, ...otrosBotones];
  for (const cada of botones) cada.disabled = true;
  boton.setAttribute('aria-busy', 'true');
  boton.textContent = textoEspera;
  try {
    return await accion();
  } finally {
    for (const cada of botones) cada.disabled = false;
    boton.removeAttribute('aria-busy');
    boton.textContent = textoOriginal;
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

/** Sello con el estado de la partida tal como lo devolvió la API. */
export function crearSello(estado, claseExtra = '') {
  const clases = ['sello', CLASES_DE_SELLO.get(estado), claseExtra].filter(Boolean).join(' ');
  return crear('span', { clase: clases, texto: textoLegible(estado) });
}

/* Formato */

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

function partesDeFecha(texto) {
  const partes = PATRON_FECHA.exec(String(texto ?? ''));
  if (partes === null) return null;
  const [, anio, mes, dia, hora, minuto, segundo] = partes;
  return { anio, mes, dia, hora, minuto, segundo };
}

/** "2026-11-09 21:30:00" → "09/11/2026 21:30"; "2026-11-10" → "10/11/2026". Otro formato se muestra tal cual. */
export function formatearFecha(texto) {
  const partes = partesDeFecha(texto);
  if (partes === null) return String(texto ?? '');
  const fecha = `${partes.dia}/${partes.mes}/${partes.anio}`;
  return partes.hora === undefined ? fecha : `${fecha} ${partes.hora}:${partes.minuto}`;
}

/** Horario de una coartada: "09/11/2026, de 21:00 a 22:00" si empieza y termina el mismo día. */
export function formatearRango(desde, hasta) {
  const inicio = partesDeFecha(desde);
  const fin = partesDeFecha(hasta);
  const mismoDia = inicio !== null && fin !== null && inicio.hora !== undefined && fin.hora !== undefined
    && inicio.anio === fin.anio && inicio.mes === fin.mes && inicio.dia === fin.dia;
  if (!mismoDia) return `${formatearFecha(desde)} a ${formatearFecha(hasta)}`;
  return `${inicio.dia}/${inicio.mes}/${inicio.anio}, de ${inicio.hora}:${inicio.minuto} a ${fin.hora}:${fin.minuto}`;
}

/** Marca de tiempo que SQLite guarda en UTC (CURRENT_TIMESTAMP), mostrada en la hora local del jugador. */
export function formatearMarcaUtc(texto) {
  const partes = partesDeFecha(texto);
  if (partes === null || partes.hora === undefined) return formatearFecha(texto);
  const instante = new Date(Date.UTC(
    Number(partes.anio), Number(partes.mes) - 1, Number(partes.dia),
    Number(partes.hora), Number(partes.minuto), Number(partes.segundo ?? 0),
  ));
  return instante.toLocaleString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** Valor de la base listo para leer: "registro_digital" → "registro digital". */
export function textoLegible(valor) {
  return String(valor ?? '').replaceAll('_', ' ');
}

/** "1 evidencia", "3 evidencias". */
export function contar(cantidad, singular, plural) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
