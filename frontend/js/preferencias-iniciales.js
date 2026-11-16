// Script clásico (no módulo) que se ejecuta en <head>, antes del primer
// pintado: aplica el tema oscuro y el idioma solo si el jugador los eligió
// antes, para que la página no aparezca un instante con el tema claro. El
// tema claro es el predeterminado: no se sigue prefers-color-scheme.
// Es un archivo externo para que funcione aunque se agregue una política de
// seguridad de contenido que bloquee los scripts en línea.
// Las claves 'detective-sql:tema' y 'detective-sql:idioma' son una copia de
// las de js/preferencias.js (un script clásico no puede importarlas): si
// cambian, hay que cambiarlas en los dos archivos.
(function () {
  'use strict';
  try {
    if (localStorage.getItem('detective-sql:tema') === 'oscuro') {
      document.documentElement.setAttribute('data-tema', 'oscuro');
      var meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute('content', 'dark');
    }
    if (localStorage.getItem('detective-sql:idioma') === 'en') {
      document.documentElement.setAttribute('lang', 'en');
    }
  } catch (error) {
    // Sin almacenamiento: tema claro y español.
  }
}());
