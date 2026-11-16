// Preferencias del jugador: idioma de la interfaz y tema de color. Se guardan
// en localStorage solo como comodidad; si el navegador lo bloquea, el juego
// sigue en español y con el tema claro. El tema se aplica antes del primer
// pintado en js/preferencias-iniciales.js; acá se mantienen los controles.

import { esIdiomaValido, establecerIdioma, idiomaActual, t } from './i18n/traductor.js';

// js/preferencias-iniciales.js tiene una copia de estas dos claves (es un script
// clásico y no puede importarlas): si cambian, hay que cambiarlas en los dos archivos.
const CLAVE_IDIOMA = 'detective-sql:idioma';
const CLAVE_TEMA = 'detective-sql:tema';
const TEMA_OSCURO = 'oscuro';
const TEMA_CLARO = 'claro';

function leerPreferencia(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento: la preferencia dura hasta que se recargue la página.
  }
}

/* Idioma */

/**
 * Aplica el idioma activo a todo lo que no dibujan las pantallas: los textos
 * fijos del HTML (data-i18n y data-i18n-<atributo>), el atributo lang y el
 * estado de los botones de idioma.
 */
export function aplicarIdioma() {
  const idioma = idiomaActual();
  document.documentElement.lang = idioma;
  for (const elemento of document.querySelectorAll('[data-i18n]')) {
    elemento.textContent = t(elemento.dataset.i18n);
  }
  for (const atributo of ['aria-label', 'content', 'title']) {
    for (const elemento of document.querySelectorAll(`[data-i18n-${atributo}]`)) {
      elemento.setAttribute(atributo, t(elemento.getAttribute(`data-i18n-${atributo}`)));
    }
  }
  for (const boton of document.querySelectorAll('[data-idioma]')) {
    boton.setAttribute('aria-pressed', String(boton.dataset.idioma === idioma));
  }
}

/* Tema */

function temaActual() {
  return document.documentElement.dataset.tema === TEMA_OSCURO ? TEMA_OSCURO : TEMA_CLARO;
}

function aplicarTema(tema) {
  const oscuro = tema === TEMA_OSCURO;
  if (oscuro) document.documentElement.dataset.tema = TEMA_OSCURO;
  else delete document.documentElement.dataset.tema;
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', oscuro ? 'dark' : 'light');
  document.getElementById('alternar-tema')?.setAttribute('aria-pressed', String(oscuro));
}

/**
 * Lee las preferencias guardadas y conecta los controles de la cabecera. El
 * tema claro es siempre el predeterminado: no se sigue prefers-color-scheme.
 *
 * @param {{ alCambiarIdioma: () => void }} acciones
 */
export function iniciarPreferencias({ alCambiarIdioma }) {
  const idiomaGuardado = leerPreferencia(CLAVE_IDIOMA);
  if (esIdiomaValido(idiomaGuardado)) establecerIdioma(idiomaGuardado);
  aplicarIdioma();
  aplicarTema(leerPreferencia(CLAVE_TEMA) === TEMA_OSCURO ? TEMA_OSCURO : TEMA_CLARO);

  for (const boton of document.querySelectorAll('[data-idioma]')) {
    boton.addEventListener('click', () => {
      const idioma = boton.dataset.idioma;
      if (idioma === idiomaActual() || !establecerIdioma(idioma)) return;
      guardarPreferencia(CLAVE_IDIOMA, idioma);
      aplicarIdioma();
      alCambiarIdioma();
    });
  }

  document.getElementById('alternar-tema')?.addEventListener('click', () => {
    const tema = temaActual() === TEMA_OSCURO ? TEMA_CLARO : TEMA_OSCURO;
    aplicarTema(tema);
    guardarPreferencia(CLAVE_TEMA, tema);
  });
}
