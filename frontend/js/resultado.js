// Pantalla 4 — Resultado (modo experiencia): el veredicto sale de la
// respuesta del arresto. Es el único lugar donde aparece el culpable, y solo
// porque la API lo reveló después de registrar la acusación.

import { crear, crearFicha, crearSello, mensajeDeError, mientrasEspera } from './dom.js';
import { formatearMarcaUtc, partes, t, traducirEnum } from './i18n/traductor.js';

let arrestoMostrado = null;
let redibujar = false;

export function mostrar(seccion, contexto) {
  const { arresto } = contexto.juego;
  // Se dibuja una vez por arresto, para que el sello no se vuelva a animar al regresar.
  if (arresto === arrestoMostrado && !redibujar) return;
  // Al cambiar el idioma se vuelve a dibujar el mismo veredicto, con el sello quieto.
  const animarSello = arresto !== arrestoMostrado;
  arrestoMostrado = arresto;
  redibujar = false;

  const { partida, acusacion, resultado, culpable } = arresto;
  const acerto = resultado === 'correcto';

  seccion.querySelector('h1').textContent = acerto ? t('resultado.resuelto') : t('resultado.equivocado');
  seccion.querySelector('.veredicto__sello').replaceChildren(
    crear('span', { clase: 'solo-lectores', texto: `${t('resultado.estadoOculto')} ` }),
    crearSello(partida.estado, animarSello ? 'sello--grande' : 'sello--grande sello--quieto'),
  );
  seccion.querySelector('.pantalla__contenido').replaceChildren(
    crear('p', { clase: 'entrada' }, resumen(acerto, acusacion, culpable)),
    crear('section', { clase: 'seccion' }, [
      crear('h2', { texto: t('resultado.titulo') }),
      crearFicha([
        [t('resultado.partida'), t('resultado.numeroPartida', { id: partida.id }), true],
        [t('resultado.acusado'), acusacion.nombre],
        [t('resultado.culpable'), culpable?.nombre ?? t('resultado.sinCulpableRegistrado')],
        [t('resultado.resultadoAcusacion'), traducirEnum('resultado', resultado)],
        [t('resultado.estadoPartida'), traducirEnum('estadoPartida', partida.estado)],
        [t('resultado.fechaAcusacion'), formatearMarcaUtc(acusacion.fechaAcusacion), true],
      ]),
    ]),
    accionesFinales(partida.casoId, contexto),
  );
}

/** Al cambiar el idioma, el veredicto se vuelve a dibujar la próxima vez que se muestre la pantalla. */
export function invalidar() {
  redibujar = true;
}

function resumen(acerto, acusacion, culpable) {
  const acusado = crear('strong', { texto: acusacion.nombre });
  if (acerto) return partes('resultado.acerto', { acusado });
  if (culpable === null || culpable === undefined) return partes('resultado.sinCulpable', { acusado });
  return partes('resultado.fallo', { acusado, culpable: crear('strong', { texto: culpable.nombre }) });
}

function accionesFinales(casoId, contexto) {
  const zonaError = crear('div');
  const nuevaPartida = crear('button', {
    clase: 'boton boton--primario',
    texto: t('expediente.iniciarOtra'),
    atributos: { type: 'button' },
  });
  nuevaPartida.addEventListener('click', async () => {
    zonaError.replaceChildren();
    try {
      await mientrasEspera(nuevaPartida, t('expediente.iniciando'), () => contexto.iniciarPartida(casoId));
    } catch (error) {
      zonaError.replaceChildren(mensajeDeError(error));
    }
  });

  return crear('div', { clase: 'seccion' }, [
    crear('div', { clase: 'acciones' }, [
      nuevaPartida,
      crear('a', { clase: 'boton boton--secundario', texto: t('resultado.volver'), atributos: { href: '#expediente' } }),
    ]),
    zonaError,
  ]);
}
