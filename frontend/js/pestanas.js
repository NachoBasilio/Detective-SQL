// Pestañas accesibles (patrón ARIA de pestañas) con una microinteracción: al
// cambiar de pestaña, el contenido se desliza hacia el costado que corresponde
// al orden de las pestañas, y en pantallas táctiles se puede deslizar con el
// dedo. El movimiento lo hace js/deslizamiento.js, el mismo que usan las
// pantallas principales; con prefers-reduced-motion el cambio es instantáneo.
// En reposo, los paneles inactivos tienen el atributo hidden.

import { crearDeslizador, estiloDeAvance, leerCurva, leerDuracion, prefiereMenosMovimiento } from './deslizamiento.js';

const UMBRAL_DE_DIRECCION = 10; // px que se mueve el dedo antes de decidir si el gesto es horizontal
const DOMINIO_HORIZONTAL = 1.2; // el desplazamiento horizontal tiene que superar al vertical en esta proporción
const FRACCION_PARA_AVANZAR = 0.25; // parte del ancho que hay que arrastrar para pasar de pestaña
const VELOCIDAD_DE_IMPULSO = 0.5; // px/ms: un movimiento rápido y corto también pasa de pestaña
const DISTANCIA_MINIMA_DE_IMPULSO = 30; // px
const RESISTENCIA_EN_EL_BORDE = 0.25; // sin pestaña vecina, el contenido acompaña poco al dedo

// Los gestos que empiezan sobre un control o una tabla desplazable no cambian de pestaña.
const SELECTOR_SIN_GESTO = 'a[href], button, input, select, textarea, label, summary, [contenteditable], .tabla-contenedor';

/**
 * @param {HTMLElement} lista elemento con role="tablist"
 * @param {HTMLElement} contenedor elemento que agrupa los role="tabpanel"
 */
export function activarPestanas(lista, contenedor) {
  const pestanas = [...lista.querySelectorAll('[role="tab"]')];
  const paneles = pestanas.map((pestana) => document.getElementById(pestana.getAttribute('aria-controls')));
  let actual = Math.max(0, pestanas.findIndex((pestana) => pestana.getAttribute('aria-selected') === 'true'));
  let gesto = null;
  const { dejarEnReposo, prepararMovimiento, seguir, animarAvance, deslizar } = crearDeslizador({
    contenedor,
    elementos: paneles,
    visibleEnReposo: () => paneles[actual],
  });

  function marcarSeleccion(indice) {
    actual = indice;
    pestanas.forEach((pestana, i) => {
      pestana.setAttribute('aria-selected', String(i === indice));
      pestana.tabIndex = i === indice ? 0 : -1;
    });
  }

  function seleccionar(indice) {
    gesto = null;
    if (indice === actual) return;
    const anterior = actual;
    dejarEnReposo();
    marcarSeleccion(indice);
    if (prefiereMenosMovimiento()) {
      dejarEnReposo();
      return;
    }
    // El panel nuevo entra al flujo enseguida: la altura cambia una sola vez y la lista de pestañas no se mueve.
    deslizar(paneles[anterior], paneles[indice], indice > anterior ? 1 : -1);
  }

  lista.addEventListener('click', (evento) => {
    const pestana = evento.target.closest('[role="tab"]');
    if (pestana) seleccionar(pestanas.indexOf(pestana));
  });
  lista.addEventListener('keydown', (evento) => {
    const enfocada = pestanas.indexOf(document.activeElement);
    if (enfocada === -1) return;
    const destinos = { ArrowRight: enfocada + 1, ArrowLeft: enfocada - 1, Home: 0, End: pestanas.length - 1 };
    if (!Object.hasOwn(destinos, evento.key)) return;
    evento.preventDefault();
    const indice = (destinos[evento.key] + pestanas.length) % pestanas.length;
    seleccionar(indice);
    pestanas[indice].focus();
  });

  /* Gesto de deslizamiento con el dedo. touch-action: pan-y pinch-zoom (estilos.css) deja el
     desplazamiento vertical y el zoom al navegador y entrega acá el movimiento horizontal. */

  function vecinoDe(desplazamiento) {
    const sentido = desplazamiento < 0 ? 1 : -1;
    const indice = actual + sentido;
    return { sentido, indice: indice >= 0 && indice < pestanas.length ? indice : null };
  }

  function seguirAlDedo(desplazamiento) {
    const { sentido, indice } = vecinoDe(desplazamiento);
    const panelActual = paneles[actual];
    if (gesto.vecino !== null && gesto.vecino !== indice) {
      const anterior = paneles[gesto.vecino];
      anterior.hidden = true;
      anterior.classList.remove('deslizable__superpuesto');
      anterior.style.removeProperty('transform');
      anterior.style.removeProperty('opacity');
      gesto.vecino = null;
    }
    if (indice === null) {
      // En la primera o la última pestaña no hay vuelta: el contenido resiste y vuelve.
      panelActual.style.removeProperty('opacity');
      panelActual.style.transform = `translateX(${desplazamiento * RESISTENCIA_EN_EL_BORDE}px)`;
      return;
    }
    if (gesto.vecino === null) {
      prepararMovimiento(panelActual, paneles[indice]);
      gesto.vecino = indice;
    }
    const avance = Math.min(Math.abs(desplazamiento) / gesto.ancho, 1);
    const estilo = estiloDeAvance(sentido, avance);
    Object.assign(panelActual.style, estilo.saliente);
    Object.assign(paneles[indice].style, estilo.entrante);
  }

  function velocidadFinal() {
    const ultimas = gesto.muestras.filter((muestra) => gesto.ultimoTiempo - muestra.tiempo <= 100);
    const primera = ultimas[0] ?? gesto.muestras[0];
    const tiempo = gesto.ultimoTiempo - primera.tiempo;
    return tiempo > 0 ? (gesto.desplazamiento - primera.desplazamiento) / tiempo : 0;
  }

  function terminarGesto(completo) {
    const { desplazamiento, ancho, sigueAlDedo } = gesto;
    const { sentido, indice } = vecinoDe(desplazamiento);
    const velocidad = velocidadFinal();
    const impulso = Math.abs(velocidad) >= VELOCIDAD_DE_IMPULSO
      && Math.abs(desplazamiento) >= DISTANCIA_MINIMA_DE_IMPULSO
      && Math.sign(velocidad) === Math.sign(desplazamiento);
    const avanza = completo && indice !== null && (Math.abs(desplazamiento) >= ancho * FRACCION_PARA_AVANZAR || impulso);
    const vecino = gesto.vecino;
    gesto = null;

    if (!sigueAlDedo || prefiereMenosMovimiento()) {
      if (avanza) marcarSeleccion(indice);
      dejarEnReposo();
      return;
    }

    const panelActual = paneles[actual];
    if (vecino === null) {
      // Borde sin vecino: el contenido vuelve a su lugar.
      const opciones = { duration: Math.min(leerDuracion(), 200), easing: leerCurva(), fill: 'both' };
      seguir([panelActual.animate(
        [{ transform: panelActual.style.transform || 'translateX(0)' }, { transform: 'translateX(0)' }],
        opciones,
      )]);
      panelActual.style.removeProperty('transform');
      return;
    }

    const avanceActual = Math.min(Math.abs(desplazamiento) / ancho, 1);
    const saliente = panelActual;
    const entrante = paneles[vecino];
    if (avanza) {
      marcarSeleccion(vecino);
      // Si el foco quedaba dentro del panel que sale, pasa al panel nuevo.
      if (saliente.contains(document.activeElement)) entrante.focus({ preventScroll: true });
    }
    for (const panel of [saliente, entrante]) {
      panel.style.removeProperty('transform');
      panel.style.removeProperty('opacity');
    }
    animarAvance(saliente, entrante, sentido, avanceActual, avanza ? 1 : 0);
  }

  contenedor.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType === 'mouse' || !evento.isPrimary) return;
    if (evento.target.closest(SELECTOR_SIN_GESTO)) return;
    gesto = {
      id: evento.pointerId,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      arrastrando: false,
      desplazamiento: 0,
      vecino: null,
      muestras: [],
      ultimoTiempo: evento.timeStamp,
    };
  });

  contenedor.addEventListener('pointermove', (evento) => {
    if (gesto === null || evento.pointerId !== gesto.id) return;
    const desplazamiento = evento.clientX - gesto.inicioX;
    const vertical = evento.clientY - gesto.inicioY;
    if (!gesto.arrastrando) {
      if (Math.abs(desplazamiento) < UMBRAL_DE_DIRECCION && Math.abs(vertical) < UMBRAL_DE_DIRECCION) return;
      if (Math.abs(desplazamiento) < Math.abs(vertical) * DOMINIO_HORIZONTAL) {
        gesto = null; // Gesto vertical: lo resuelve el navegador como desplazamiento de la página.
        return;
      }
      dejarEnReposo();
      gesto.arrastrando = true;
      gesto.ancho = contenedor.clientWidth || 1;
      gesto.sigueAlDedo = !prefiereMenosMovimiento();
      contenedor.setPointerCapture(evento.pointerId);
    }
    gesto.desplazamiento = desplazamiento;
    gesto.ultimoTiempo = evento.timeStamp;
    gesto.muestras.push({ desplazamiento, tiempo: evento.timeStamp });
    if (gesto.muestras.length > 20) gesto.muestras.shift();
    if (gesto.sigueAlDedo) seguirAlDedo(desplazamiento);
  });

  contenedor.addEventListener('pointerup', (evento) => {
    if (gesto === null || evento.pointerId !== gesto.id) return;
    if (gesto.arrastrando) terminarGesto(true);
    else gesto = null;
  });

  contenedor.addEventListener('pointercancel', (evento) => {
    if (gesto === null || evento.pointerId !== gesto.id) return;
    if (gesto.arrastrando) terminarGesto(false);
    else gesto = null;
  });

  dejarEnReposo();
}
