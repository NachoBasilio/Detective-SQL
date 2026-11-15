// Pantalla 3 — Acusación (modo operación, acción irreversible): elegir un
// sospechoso, confirmar y enviar el arresto al backend. SQLite impone la regla
// de un solo arresto por partida: si se intenta otra vez, la interfaz muestra
// el error 409 que devuelve la API en lugar de bloquearlo por su cuenta.

import * as api from './api.js';
import { crear, mensajeDeCarga, mensajeDeError, mensajeVacio, mientrasEspera, nuevoId } from './dom.js';

let partidaPreparadaId = null;

export function mostrar(seccion, contexto) {
  const { partida } = contexto.juego;
  if (partida.id === partidaPreparadaId) return;
  partidaPreparadaId = partida.id;
  cargarSospechosos(seccion.querySelector('.pantalla__contenido'), contexto, partida.id);
}

async function cargarSospechosos(contenedor, contexto, partidaId) {
  contenedor.replaceChildren(mensajeDeCarga('Cargando sospechosos…'));
  try {
    const sospechosos = await api.listarSospechosos(contexto.juego.partida.casoId);
    if (partidaId !== partidaPreparadaId) return;
    if (sospechosos.length === 0) {
      contenedor.replaceChildren(mensajeVacio('Este caso no tiene sospechosos para acusar.'));
      return;
    }
    mostrarSeleccion({ contenedor, contexto, partidaId, sospechosos });
  } catch (error) {
    if (partidaId !== partidaPreparadaId) return;
    contenedor.replaceChildren(mensajeDeError(error, {
      reintentar: () => cargarSospechosos(contenedor, contexto, partidaId),
    }));
  }
}

/** Paso 1: elegir a quién arrestar. */
function mostrarSeleccion(estado, { elegidoId = null, moverFoco = false } = {}) {
  const { contenedor, sospechosos } = estado;
  const idError = nuevoId('error-seleccion');
  const error = crear('p', { clase: 'error-campo', atributos: { id: idError, role: 'alert' } });

  const opciones = sospechosos.map((sospechoso) => {
    const entrada = crear('input', {
      atributos: { type: 'radio', name: 'sospechoso', value: sospechoso.id, 'aria-describedby': idError },
    });
    entrada.checked = sospechoso.id === elegidoId;
    return crear('label', { clase: 'opcion' }, [
      entrada,
      crear('span', { clase: 'opcion__nombre', texto: sospechoso.nombre }),
      crear('span', { clase: 'opcion__detalle', texto: sospechoso.relacionVictima }),
    ]);
  });

  const formulario = crear('form', { clase: 'flujo', atributos: { novalidate: '' } }, [
    crear('fieldset', {}, [
      crear('legend', { texto: 'Sospechoso a arrestar' }),
      crear('div', { clase: 'opciones' }, opciones),
    ]),
    error,
    crear('div', { clase: 'acciones' }, [
      crear('button', { clase: 'boton boton--primario', texto: 'Revisar la orden de arresto', atributos: { type: 'submit' } }),
    ]),
  ]);

  formulario.addEventListener('change', () => {
    error.textContent = '';
  });
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const marcada = formulario.querySelector('input[name="sospechoso"]:checked');
    if (marcada === null) {
      error.textContent = 'Seleccione un sospechoso para revisar la orden de arresto.';
      formulario.querySelector('input[name="sospechoso"]').focus();
      return;
    }
    const elegido = sospechosos.find((sospechoso) => String(sospechoso.id) === marcada.value);
    mostrarConfirmacion(estado, elegido);
  });

  contenedor.replaceChildren(formulario);
  if (moverFoco) (formulario.querySelector('input:checked') ?? formulario.querySelector('input')).focus();
}

/** Paso 2: confirmación explícita antes de enviar la orden a la API. */
function mostrarConfirmacion(estado, sospechoso) {
  const { contenedor, contexto, partidaId } = estado;
  const idTitulo = nuevoId('confirmacion');
  const titulo = crear('h2', { texto: 'Confirmar la orden de arresto', atributos: { id: idTitulo, tabindex: -1 } });
  const zonaError = crear('div');
  const emitir = crear('button', { clase: 'boton boton--peligro', texto: 'Emitir orden de arresto', atributos: { type: 'button' } });
  const volver = crear('button', { clase: 'boton boton--secundario', texto: 'Elegir otro sospechoso', atributos: { type: 'button' } });

  volver.addEventListener('click', () => mostrarSeleccion(estado, { elegidoId: sospechoso.id, moverFoco: true }));
  emitir.addEventListener('click', async () => {
    zonaError.replaceChildren();
    try {
      const arresto = await mientrasEspera(
        emitir,
        'Enviando la orden…',
        () => api.arrestar(partidaId, sospechoso.id),
        [volver],
      );
      // Si el jugador vuelve a esta pantalla, encuentra el formulario y no esta confirmación.
      mostrarSeleccion(estado);
      contexto.registrarArresto(arresto);
    } catch (error) {
      const salida = error?.estado === 409
        ? { enlace: { texto: 'Ir al expediente para iniciar una partida nueva', href: '#expediente' } }
        : {};
      zonaError.replaceChildren(mensajeDeError(error, salida));
    }
  });

  contenedor.replaceChildren(crear('section', { clase: 'confirmacion', atributos: { 'aria-labelledby': idTitulo } }, [
    titulo,
    crear('p', { clase: 'lectura' }, [
      'Va a emitir una orden de arresto contra ',
      crear('strong', { texto: sospechoso.nombre }),
      ` (${sospechoso.relacionVictima}).`,
    ]),
    crear('p', { clase: 'lectura', texto: 'Cada partida admite un solo arresto: el resultado queda registrado y no se puede cambiar.' }),
    zonaError,
    crear('div', { clase: 'acciones' }, [emitir, volver]),
  ]));
  titulo.focus();
}
