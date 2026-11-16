// Deslizamiento lateral compartido por las pestañas de la investigación
// (js/pestanas.js) y las pantallas principales (js/app.js): un elemento sale
// hacia un costado mientras otro entra desde el opuesto, dentro de un
// contenedor .deslizable que recorta el desborde solo mientras se mueven. Solo
// se animan transform y opacity, con los tokens --duracion-pestana y
// --curva-pestana. En reposo, el único elemento sin el atributo hidden es el
// que corresponde mostrar.

const DURACION_DE_RESPALDO = 300; // ms, si el token no se puede leer
const DURACION_MINIMA = 80; // ms, para terminar un movimiento ya casi completo
const CLASE_EN_MOVIMIENTO = 'deslizable--en-movimiento';
const CLASE_SUPERPUESTO = 'deslizable__superpuesto';

export function prefiereMenosMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Duración del deslizamiento en milisegundos, leída del token --duracion-pestana ("300ms" o "0.3s"). */
export function leerDuracion() {
  const valor = getComputedStyle(document.documentElement).getPropertyValue('--duracion-pestana').trim();
  const numero = Number.parseFloat(valor);
  if (!Number.isFinite(numero)) return DURACION_DE_RESPALDO;
  return valor.endsWith('ms') ? numero : numero * 1000;
}

export function leerCurva() {
  return getComputedStyle(document.documentElement).getPropertyValue('--curva-pestana').trim() || 'ease-out';
}

/**
 * Estilo de los dos elementos para un avance entre 0 (el actual en su lugar)
 * y 1 (el nuevo en su lugar). sentido = 1 si el nuevo entra por la derecha
 * (sigue en el orden) y -1 si entra por la izquierda. El que entra no se
 * desvanece: así el desplazamiento lateral se ve desde el primer cuadro. Solo
 * el que sale se apaga mientras se va.
 */
export function estiloDeAvance(sentido, avance) {
  return {
    saliente: { transform: `translateX(${-sentido * avance * 100}%)`, opacity: 1 - avance },
    entrante: { transform: `translateX(${sentido * (1 - avance) * 100}%)`, opacity: 1 },
  };
}

/**
 * Controla el deslizamiento entre los hijos de un contenedor .deslizable.
 *
 * @param {{ contenedor: HTMLElement, elementos: HTMLElement[], visibleEnReposo: () => HTMLElement }} opciones
 *   visibleEnReposo dice qué elemento queda visible cuando no hay movimiento.
 */
export function crearDeslizador({ contenedor, elementos, visibleEnReposo }) {
  let animaciones = [];

  /** Termina cualquier movimiento (sin esperar a que acabe) y deja visible solo el elemento que corresponde. */
  function dejarEnReposo() {
    for (const animacion of animaciones) animacion.cancel();
    animaciones = [];
    contenedor.classList.remove(CLASE_EN_MOVIMIENTO);
    const visible = visibleEnReposo();
    for (const elemento of elementos) {
      elemento.classList.remove(CLASE_SUPERPUESTO);
      elemento.style.removeProperty('transform');
      elemento.style.removeProperty('opacity');
      elemento.hidden = elemento !== visible;
    }
  }

  /**
   * Prepara dos elementos para moverse: uno sigue en el flujo (y define la
   * altura) y el otro se superpone arriba, alineado. Así lo que está por encima
   * del contenedor no se mueve.
   */
  function prepararMovimiento(enFlujo, superpuesto) {
    contenedor.classList.add(CLASE_EN_MOVIMIENTO);
    enFlujo.hidden = false;
    superpuesto.hidden = false;
    superpuesto.classList.add(CLASE_SUPERPUESTO);
  }

  /** Sigue las animaciones dadas y, cuando terminan, deja el contenedor en reposo. */
  function seguir(nuevas) {
    animaciones = nuevas;
    Promise.all(nuevas.map((animacion) => animacion.finished))
      .then(() => {
        // Si otro movimiento ya canceló estas animaciones, no hay nada que limpiar.
        if (animaciones === nuevas) dejarEnReposo();
      })
      .catch(() => {});
  }

  /** Anima los dos elementos de un avance a otro (por ejemplo, desde donde los dejó un gesto) y luego los deja en reposo. */
  function animarAvance(saliente, entrante, sentido, desde, hasta) {
    const duracion = Math.max(DURACION_MINIMA, leerDuracion() * Math.abs(hasta - desde));
    const opciones = { duration: duracion, easing: leerCurva(), fill: 'both' };
    const inicio = estiloDeAvance(sentido, desde);
    const fin = estiloDeAvance(sentido, hasta);
    seguir([
      saliente.animate([inicio.saliente, fin.saliente], opciones),
      entrante.animate([inicio.entrante, fin.entrante], opciones),
    ]);
  }

  /**
   * Deslizamiento completo: el elemento nuevo entra al flujo enseguida (la
   * altura cambia una sola vez) y el anterior se superpone mientras sale.
   * Quien llama ya actualizó visibleEnReposo() para que devuelva el nuevo.
   */
  function deslizar(saliente, entrante, sentido) {
    prepararMovimiento(entrante, saliente);
    animarAvance(saliente, entrante, sentido, 0, 1);
  }

  return { dejarEnReposo, prepararMovimiento, seguir, animarAvance, deslizar };
}
