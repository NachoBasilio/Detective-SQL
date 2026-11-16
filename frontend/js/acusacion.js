// Pantalla 3 — Acusación (modo operación, acción irreversible): elegir un
// sospechoso, confirmar en un diálogo modal y enviar el arresto al backend.
// SQLite impone la regla de un solo arresto por partida: si se intenta otra
// vez, la interfaz muestra el error 409 que devuelve la API en lugar de
// bloquearlo por su cuenta.

import * as api from './api.js';
import { crear, mensajeDeCarga, mensajeDeError, mensajeVacio, mientrasEspera, nuevoId } from './dom.js';
import { partes, t, traducirContenido } from './i18n/traductor.js';

let partidaPreparadaId = null;
// Sospechoso marcado en el paso 1, para conservarlo si la pantalla se vuelve a dibujar (por ejemplo, al cambiar el idioma).
let seleccion = { partidaId: null, sospechosoId: null };
// Diálogo de confirmación abierto, si hay uno: se cierra al salir de la pantalla.
let confirmacionAbierta = null;

export function mostrar(seccion, contexto) {
  const { partida } = contexto.juego;
  if (partida.id === partidaPreparadaId) return;
  partidaPreparadaId = partida.id;
  cargarSospechosos(seccion.querySelector('.pantalla__contenido'), contexto, partida.id);
}

/** Al cambiar el idioma, el formulario se vuelve a dibujar la próxima vez que se muestre la pantalla. */
export function invalidar() {
  partidaPreparadaId = null;
}

/** Al navegar a otra pantalla (por ejemplo, con "atrás"), el diálogo no queda abierto encima. */
export function alSalir() {
  confirmacionAbierta?.cerrarPorSalida();
}

async function cargarSospechosos(contenedor, contexto, partidaId) {
  contenedor.replaceChildren(mensajeDeCarga(t('acusacion.cargando')));
  try {
    const sospechosos = await api.listarSospechosos(contexto.juego.partida.casoId);
    if (partidaId !== partidaPreparadaId) return;
    if (sospechosos.length === 0) {
      contenedor.replaceChildren(mensajeVacio(t('acusacion.sinSospechosos')));
      return;
    }
    const elegidoId = seleccion.partidaId === partidaId ? seleccion.sospechosoId : null;
    mostrarSeleccion({ contenedor, contexto, partidaId, sospechosos }, { elegidoId });
  } catch (error) {
    if (partidaId !== partidaPreparadaId) return;
    contenedor.replaceChildren(mensajeDeError(error, {
      reintentar: () => cargarSospechosos(contenedor, contexto, partidaId),
    }));
  }
}

/** Paso 1: elegir a quién arrestar. */
function mostrarSeleccion(estado, { elegidoId = null } = {}) {
  const { contenedor, partidaId, sospechosos } = estado;
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
      crear('span', { clase: 'opcion__detalle', texto: traducirContenido(sospechoso.relacionVictima) }),
    ]);
  });

  const formulario = crear('form', { clase: 'flujo', atributos: { novalidate: '' } }, [
    crear('fieldset', {}, [
      crear('legend', { texto: t('acusacion.leyenda') }),
      crear('div', { clase: 'opciones' }, opciones),
    ]),
    error,
    crear('div', { clase: 'acciones' }, [
      crear('button', { clase: 'boton boton--primario', texto: t('acusacion.revisar'), atributos: { type: 'submit' } }),
    ]),
  ]);

  formulario.addEventListener('change', () => {
    error.textContent = '';
    const marcada = formulario.querySelector('input[name="sospechoso"]:checked');
    seleccion = { partidaId, sospechosoId: marcada === null ? null : Number(marcada.value) };
  });
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const marcada = formulario.querySelector('input[name="sospechoso"]:checked');
    if (marcada === null) {
      error.textContent = t('acusacion.faltaSeleccion');
      formulario.querySelector('input[name="sospechoso"]').focus();
      return;
    }
    const elegido = sospechosos.find((sospechoso) => String(sospechoso.id) === marcada.value);
    abrirConfirmacion(estado, elegido, marcada);
  });

  contenedor.replaceChildren(formulario);
}

/**
 * Paso 2: confirmación explícita en un diálogo modal antes de enviar la orden
 * a la API. Escape o "Elegir otro sospechoso" cierran el diálogo y devuelven
 * el foco a la opción marcada. Mientras se envía la orden, el diálogo no se
 * puede cerrar y los botones quedan deshabilitados. Un clic fuera del diálogo
 * no lo cierra.
 */
function abrirConfirmacion(estado, sospechoso, opcionMarcada) {
  const { contexto, partidaId } = estado;
  const idTitulo = nuevoId('confirmacion');
  const titulo = crear('h2', { texto: t('acusacion.confirmarTitulo'), atributos: { id: idTitulo, tabindex: -1 } });
  const zonaError = crear('div', { clase: 'dialogo__error' });
  const emitir = crear('button', { clase: 'boton boton--peligro', texto: t('acusacion.emitir'), atributos: { type: 'button' } });
  const volver = crear('button', { clase: 'boton boton--secundario', texto: t('acusacion.elegirOtro'), atributos: { type: 'button' } });

  const dialogo = crear('dialog', { clase: 'dialogo', atributos: { 'aria-labelledby': idTitulo } }, [
    titulo,
    crear('p', { clase: 'lectura' }, partes('acusacion.confirmarTexto', {
      nombre: crear('strong', { texto: sospechoso.nombre }),
      relacion: traducirContenido(sospechoso.relacionVictima),
    })),
    crear('p', { clase: 'lectura', texto: t('acusacion.irreversible') }),
    zonaError,
    crear('div', { clase: 'acciones' }, [emitir, volver]),
  ]);

  let enviando = false;
  let arrestado = false;
  let salio = false; // el jugador dejó la pantalla: el foco no vuelve al formulario

  function descartar() {
    dialogo.remove();
    if (confirmacionAbierta?.dialogo === dialogo) confirmacionAbierta = null;
  }

  dialogo.addEventListener('cancel', (evento) => {
    // Escape mientras se envía la orden: el diálogo sigue abierto.
    if (enviando) evento.preventDefault();
  });
  dialogo.addEventListener('close', () => {
    // Algunos navegadores cierran igual ante un segundo Escape: el envío en curso decide qué sigue.
    if (enviando) return;
    descartar();
    if (!arrestado && !salio && opcionMarcada.isConnected) opcionMarcada.focus();
  });
  volver.addEventListener('click', () => dialogo.close());

  emitir.addEventListener('click', async () => {
    zonaError.replaceChildren();
    enviando = true;
    let arresto;
    try {
      arresto = await mientrasEspera(emitir, t('acusacion.enviando'), () => api.arrestar(partidaId, sospechoso.id), [volver]);
    } catch (error) {
      enviando = false;
      if (salio) {
        descartar();
        return;
      }
      if (!dialogo.open) dialogo.showModal();
      const salida = error?.estado === 409
        ? { enlace: { texto: t('acusacion.irAlExpediente'), href: '#expediente', alActivar: () => confirmacionAbierta?.cerrarPorSalida() } }
        : {};
      zonaError.replaceChildren(mensajeDeError(error, salida));
      return;
    }
    enviando = false;
    arrestado = true;
    if (dialogo.open) dialogo.close();
    else descartar();
    // Si el jugador vuelve a esta pantalla, encuentra el formulario sin selección.
    seleccion = { partidaId: null, sospechosoId: null };
    mostrarSeleccion(estado);
    contexto.registrarArresto(arresto);
  });

  confirmacionAbierta = {
    dialogo,
    cerrarPorSalida() {
      salio = true;
      // Con una orden en curso, el diálogo se cierra igual y el final del envío lo descarta.
      if (dialogo.open) dialogo.close();
      else if (!enviando) descartar();
    },
  };

  document.body.append(dialogo);
  dialogo.showModal();
  titulo.focus();
}
