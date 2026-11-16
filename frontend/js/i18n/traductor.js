// Núcleo de la traducción: idioma activo, textos de la interfaz con
// parámetros y plurales, valores de la base, textos libres de la semilla,
// mensajes de error de la API y formato de fechas según el idioma.
// Módulo puro: no toca el DOM ni el almacenamiento, así que se puede importar
// desde Node.js en los tests. El idioma lo cambia js/preferencias.js
// (iniciarPreferencias) con establecerIdioma.

import { CATALOGOS } from './catalogos.js';
import { CONTENIDO_EN, ENUMERADOS, ERRORES_DE_API_EN } from './contenido.js';

export const IDIOMAS = Object.freeze(['es', 'en']);
export const IDIOMA_PREDETERMINADO = 'es';

/** Configuración regional de Intl para cada idioma del juego. */
const LOCALES = Object.freeze({ es: 'es', en: 'en-US' });

let idioma = IDIOMA_PREDETERMINADO;

export function idiomaActual() {
  return idioma;
}

export function esIdiomaValido(valor) {
  return IDIOMAS.includes(valor);
}

/** Cambia el idioma activo. Devuelve false si el idioma no existe. */
export function establecerIdioma(nuevo) {
  if (!esIdiomaValido(nuevo)) return false;
  idioma = nuevo;
  return true;
}

/* Textos de la interfaz */

const reglasPlurales = new Map();

function categoriaPlural(cantidad) {
  if (!reglasPlurales.has(idioma)) reglasPlurales.set(idioma, new Intl.PluralRules(LOCALES[idioma]));
  return reglasPlurales.get(idioma).select(Number(cantidad));
}

function plantillaDe(clave, parametros) {
  const entrada = CATALOGOS[idioma][clave] ?? CATALOGOS[IDIOMA_PREDETERMINADO][clave];
  if (entrada === undefined) return clave;
  if (typeof entrada === 'string') return entrada;
  return entrada[categoriaPlural(parametros.cantidad)] ?? entrada.other;
}

/**
 * Texto de la clave dividido en partes: cada marca {nombre} se reemplaza por
 * su parámetro sin convertirlo, así un parámetro puede ser un nodo del DOM
 * (por ejemplo, un nombre en <strong>). Una marca sin parámetro queda tal cual.
 *
 * @param {string} clave
 * @param {Record<string, unknown>} [parametros]
 * @returns {unknown[]}
 */
export function partes(clave, parametros = {}) {
  const plantilla = plantillaDe(clave, parametros);
  const resultado = [];
  let desde = 0;
  for (const marca of plantilla.matchAll(/\{(\w+)\}/g)) {
    resultado.push(plantilla.slice(desde, marca.index));
    resultado.push(Object.hasOwn(parametros, marca[1]) ? parametros[marca[1]] : marca[0]);
    desde = marca.index + marca[0].length;
  }
  resultado.push(plantilla.slice(desde));
  return resultado.filter((parte) => parte !== '');
}

/** Texto de la interfaz en el idioma activo, con sus parámetros. */
export function t(clave, parametros = {}) {
  return partes(clave, parametros).map(String).join('');
}

/* Datos de la base */

/** Valor de la base listo para leer cuando no tiene traducción: "registro_digital" → "registro digital". */
export function textoLegible(valor) {
  return String(valor ?? '').replaceAll('_', ' ');
}

/**
 * Valor fijo de la base (estado, tipo, vínculo, tipo de lugar o resultado) en
 * el idioma activo. Un valor desconocido se muestra legible, sin traducir.
 */
export function traducirEnum(grupo, valor) {
  const tabla = ENUMERADOS[idioma][grupo];
  return tabla !== undefined && Object.hasOwn(tabla, valor) ? tabla[valor] : textoLegible(valor);
}

/** Texto libre de la base en el idioma activo; si no tiene traducción, el original. */
export function traducirContenido(texto) {
  if (idioma === 'es' || typeof texto !== 'string') return texto;
  return Object.hasOwn(CONTENIDO_EN, texto) ? CONTENIDO_EN[texto] : texto;
}

/** Mensaje de error del backend en el idioma activo; si no se conoce, el original. */
export function traducirErrorDeApi(mensaje) {
  if (idioma === 'es') return mensaje;
  return Object.hasOwn(ERRORES_DE_API_EN, mensaje) ? ERRORES_DE_API_EN[mensaje] : mensaje;
}

/* Fechas: la base guarda "AAAA-MM-DD" o "AAAA-MM-DD HH:MM[:SS]" */

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const OPCIONES_FECHA = Object.freeze({
  es: Object.freeze({ day: '2-digit', month: '2-digit', year: 'numeric' }),
  en: Object.freeze({ month: 'short', day: 'numeric', year: 'numeric' }),
});
// Reloj de 24 horas en los dos idiomas: las pistas se comparan al minuto (21:29, 21:30).
const OPCIONES_HORA = Object.freeze({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const formateadores = new Map();

function formateador(tipo, zonaHoraria) {
  const clave = `${idioma}|${tipo}|${zonaHoraria ?? 'local'}`;
  if (!formateadores.has(clave)) {
    const opciones = { ...(tipo === 'fecha' ? OPCIONES_FECHA[idioma] : OPCIONES_HORA) };
    if (zonaHoraria) opciones.timeZone = zonaHoraria;
    formateadores.set(clave, new Intl.DateTimeFormat(LOCALES[idioma], opciones));
  }
  return formateadores.get(clave);
}

function partesDeFecha(texto) {
  const coincidencia = PATRON_FECHA.exec(String(texto ?? ''));
  if (coincidencia === null) return null;
  const [, anio, mes, dia, hora, minuto, segundo] = coincidencia;
  return { anio, mes, dia, hora, minuto, segundo };
}

/** Instante cuyos campos UTC son los de la fecha escrita en la base. */
function instanteDe(componentes) {
  return new Date(Date.UTC(
    Number(componentes.anio), Number(componentes.mes) - 1, Number(componentes.dia),
    Number(componentes.hora ?? 0), Number(componentes.minuto ?? 0), Number(componentes.segundo ?? 0),
  ));
}

/**
 * Fecha (y hora, si la tiene) del juego tal como está escrita en la base, en
 * el formato del idioma: "2026-11-09 21:30:00" → "09/11/2026 21:30" o
 * "Nov 9, 2026, 21:30". Otro formato se muestra tal cual.
 */
export function formatearFecha(texto) {
  const fecha = partesDeFecha(texto);
  if (fecha === null) return String(texto ?? '');
  // Se formatea en UTC para conservar la hora escrita, sin convertirla a la zona del jugador.
  const instante = instanteDe(fecha);
  const dia = formateador('fecha', 'UTC').format(instante);
  if (fecha.hora === undefined) return dia;
  return t('formato.fechaHora', { fecha: dia, hora: formateador('hora', 'UTC').format(instante) });
}

/** Horario de una coartada: "09/11/2026, de 21:00 a 22:00" si empieza y termina el mismo día. */
export function formatearRango(desde, hasta) {
  const inicio = partesDeFecha(desde);
  const fin = partesDeFecha(hasta);
  const mismoDia = inicio !== null && fin !== null && inicio.hora !== undefined && fin.hora !== undefined
    && inicio.anio === fin.anio && inicio.mes === fin.mes && inicio.dia === fin.dia;
  if (!mismoDia) return t('formato.rango', { desde: formatearFecha(desde), hasta: formatearFecha(hasta) });
  const hora = formateador('hora', 'UTC');
  return t('formato.rangoMismoDia', {
    fecha: formateador('fecha', 'UTC').format(instanteDe(inicio)),
    desde: hora.format(instanteDe(inicio)),
    hasta: hora.format(instanteDe(fin)),
  });
}

/** Marca de tiempo que SQLite guarda en UTC (CURRENT_TIMESTAMP), mostrada en la hora local del jugador. */
export function formatearMarcaUtc(texto) {
  const fecha = partesDeFecha(texto);
  if (fecha === null || fecha.hora === undefined) return formatearFecha(texto);
  const instante = instanteDe(fecha);
  return t('formato.fechaHora', {
    fecha: formateador('fecha').format(instante),
    hora: formateador('hora').format(instante),
  });
}
