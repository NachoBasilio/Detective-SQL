// Pantalla 4 — Resultado (modo experiencia): el veredicto sale de la
// respuesta del arresto. Es el único lugar donde aparece el culpable, y solo
// porque la API lo reveló después de registrar la acusación.

import {
  crear,
  crearFicha,
  crearSello,
  formatearMarcaUtc,
  mensajeDeError,
  mientrasEspera,
  textoLegible,
} from './dom.js';

let arrestoMostrado = null;

export function mostrar(seccion, contexto) {
  const { arresto } = contexto.juego;
  // Se dibuja una vez por arresto, para que el sello no se vuelva a animar al regresar.
  if (arresto === arrestoMostrado) return;
  arrestoMostrado = arresto;

  const { partida, acusacion, resultado, culpable } = arresto;
  const acerto = resultado === 'correcto';

  seccion.querySelector('h1').textContent = acerto ? 'Caso resuelto' : 'Arresto equivocado';
  seccion.querySelector('.veredicto__sello').replaceChildren(
    crear('span', { clase: 'solo-lectores', texto: 'Estado de la partida: ' }),
    crearSello(partida.estado, 'sello--grande'),
  );
  seccion.querySelector('.pantalla__contenido').replaceChildren(
    crear('p', { clase: 'entrada' }, resumen(acerto, acusacion, culpable)),
    crear('section', { clase: 'seccion' }, [
      crear('h2', { texto: 'Resultado de la investigación' }),
      crearFicha([
        ['Partida', `N.º ${partida.id}`, true],
        ['Persona acusada', acusacion.nombre],
        ['Culpable del caso', culpable?.nombre ?? 'Sin culpable registrado'],
        ['Resultado de la acusación', textoLegible(resultado)],
        ['Estado de la partida', textoLegible(partida.estado)],
        ['Fecha de la acusación', formatearMarcaUtc(acusacion.fechaAcusacion), true],
      ]),
    ]),
    accionesFinales(partida.casoId, contexto),
  );
}

function resumen(acerto, acusacion, culpable) {
  const acusado = crear('strong', { texto: acusacion.nombre });
  if (acerto) return ['La orden de arresto contra ', acusado, ' fue correcta: es quien cometió el crimen.'];
  if (culpable === null || culpable === undefined) {
    return [acusado, ' no cometió el crimen, y la base de datos no tiene un culpable registrado para este caso.'];
  }
  return [acusado, ' no cometió el crimen. El culpable era ', crear('strong', { texto: culpable.nombre }), '.'];
}

function accionesFinales(casoId, contexto) {
  const zonaError = crear('div');
  const nuevaPartida = crear('button', {
    clase: 'boton boton--primario',
    texto: 'Iniciar una partida nueva',
    atributos: { type: 'button' },
  });
  nuevaPartida.addEventListener('click', async () => {
    zonaError.replaceChildren();
    try {
      await mientrasEspera(nuevaPartida, 'Iniciando partida…', () => contexto.iniciarPartida(casoId));
    } catch (error) {
      zonaError.replaceChildren(mensajeDeError(error));
    }
  });

  return crear('div', { clase: 'seccion' }, [
    crear('div', { clase: 'acciones' }, [
      nuevaPartida,
      crear('a', { clase: 'boton boton--secundario', texto: 'Volver al expediente', atributos: { href: '#expediente' } }),
    ]),
    zonaError,
  ]);
}
