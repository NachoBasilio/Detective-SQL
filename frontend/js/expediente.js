// Pantalla 1 — Expediente (modo lectura): título y descripción del crimen,
// fecha y lugar, inicio de la partida, partidas en curso para retomar y lista
// de sospechosos. Todo sale de la API; los datos de cada caso se piden una
// sola vez, y las partidas en curso cada vez que se muestra la pantalla.

import * as api from './api.js';
import {
  crear,
  crearFicha,
  mensajeDeCarga,
  mensajeDeError,
  mensajeVacio,
  mientrasEspera,
  nuevoId,
} from './dom.js';
import {
  formatearFecha,
  formatearMarcaUtc,
  formatearRango,
  partes,
  t,
  traducirContenido,
  traducirEnum,
} from './i18n/traductor.js';

let casos = null;
let casoElegidoId = null;
const expedientes = new Map(); // casoId → { caso, sospechosos }
let ultimaSolicitud = 0;

export function mostrar(seccion, contexto) {
  renderizar(seccion, contexto);
}

async function renderizar(seccion, contexto) {
  const titulo = seccion.querySelector('h1');
  const contenido = seccion.querySelector('.pantalla__contenido');
  const solicitud = ++ultimaSolicitud;

  try {
    if (casos === null) {
      contenido.replaceChildren(mensajeDeCarga(t('expediente.cargando')));
      casos = await api.listarCasos();
    }
    if (casos.length === 0) {
      titulo.textContent = t('pantallas.expediente');
      contenido.replaceChildren(mensajeVacio(t('expediente.sinCasos')));
      return;
    }

    const casoId = casoElegidoId ?? contexto.juego.partida?.casoId ?? casos[0].id;
    if (!expedientes.has(casoId)) {
      contenido.replaceChildren(mensajeDeCarga(t('expediente.cargando')));
      const [caso, sospechosos] = await Promise.all([api.obtenerCaso(casoId), api.listarSospechosos(casoId)]);
      expedientes.set(casoId, { caso, sospechosos });
    }
    if (solicitud !== ultimaSolicitud) return;

    const { caso, sospechosos } = expedientes.get(casoId);
    titulo.textContent = traducirContenido(caso.titulo);
    contenido.replaceChildren(...[
      casos.length > 1 ? selectorDeCaso(casoId, seccion, contexto) : null,
      crear('p', { clase: 'entrada', texto: traducirContenido(caso.descripcion) }),
      seccionDeHechos(caso),
      inicioDePartida(caso.id, contexto),
      seccionDePartidasEnCurso(caso.id, contexto),
      seccionDeSospechosos(sospechosos),
    ].filter(Boolean));
  } catch (error) {
    if (solicitud !== ultimaSolicitud) return;
    titulo.textContent = t('pantallas.expediente');
    contenido.replaceChildren(mensajeDeError(error, { reintentar: () => renderizar(seccion, contexto) }));
  }
}

/** Solo aparece si la base tiene más de un caso. */
function selectorDeCaso(casoId, seccion, contexto) {
  const id = nuevoId('caso');
  const selector = crear('select', { atributos: { id } }, casos.map((caso) => {
    const opcion = crear('option', { texto: traducirContenido(caso.titulo), atributos: { value: caso.id } });
    opcion.selected = caso.id === casoId;
    return opcion;
  }));
  selector.addEventListener('change', () => {
    casoElegidoId = Number(selector.value);
    renderizar(seccion, contexto);
  });
  return crear('p', { clase: 'campo' }, [crear('label', { texto: t('expediente.caso'), atributos: { for: id } }), selector]);
}

/** Fecha y ubicación del crimen: vienen de la escena principal del caso. */
function seccionDeHechos(caso) {
  const escena = caso.escenaPrincipal;
  const sinEscena = t('expediente.sinEscena');
  return crear('section', { clase: 'seccion' }, [
    crear('h2', { texto: t('expediente.hechos') }),
    crearFicha([
      [t('expediente.fechaCrimen'), escena ? formatearFecha(escena.horaSuceso) : sinEscena, escena !== null],
      [t('expediente.lugar'), escena
        ? t('expediente.lugarConTipo', { lugar: traducirContenido(escena.lugar), tipo: traducirEnum('tipoLugar', escena.tipoLugar) })
        : sinEscena],
      [t('expediente.apertura'), formatearFecha(caso.fechaApertura), true],
      [t('expediente.estadoCaso'), traducirEnum('estadoCaso', caso.estado)],
    ]),
  ]);
}

function inicioDePartida(casoId, contexto) {
  const { partida } = contexto.juego;
  const enCurso = partida !== null && partida.casoId === casoId && partida.estado === 'en_curso';
  const zonaError = crear('div');

  const iniciar = crear('button', {
    clase: `boton ${enCurso ? 'boton--secundario' : 'boton--primario'}`,
    texto: enCurso ? t('expediente.iniciarOtra') : t('expediente.iniciarPartida'),
    atributos: { type: 'button' },
  });
  iniciar.addEventListener('click', async () => {
    zonaError.replaceChildren();
    try {
      await mientrasEspera(iniciar, t('expediente.iniciando'), () => contexto.iniciarPartida(casoId));
    } catch (error) {
      zonaError.replaceChildren(mensajeDeError(error));
    }
  });

  const botones = enCurso
    ? [crear('a', { clase: 'boton boton--primario', texto: t('expediente.continuar'), atributos: { href: '#investigacion' } }), iniciar]
    : [iniciar];
  const explicacion = enCurso
    ? t('expediente.partidaEnCurso', { id: partida.id })
    : t('expediente.explicacionInicio');

  return crear('div', { clase: 'seccion' }, [
    crear('p', { clase: 'lectura', texto: explicacion }),
    crear('div', { clase: 'acciones' }, botones),
    zonaError,
  ]);
}

/* Partidas en curso: se pueden retomar. Las terminadas no se listan, porque
   mostrar su resultado obligaría a la API a revelar el culpable por GET. */

function seccionDePartidasEnCurso(casoId, contexto) {
  const idTitulo = nuevoId('partidas');
  const zona = crear('div', { clase: 'seccion' });
  cargarPartidasEnCurso(zona, casoId, contexto);
  return crear('section', { clase: 'seccion', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h2', { texto: t('partidas.titulo'), atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta lectura', texto: t('partidas.explicacion') }),
    zona,
  ]);
}

async function cargarPartidasEnCurso(zona, casoId, contexto, aviso = null) {
  zona.replaceChildren(mensajeDeCarga(t('partidas.cargando')));
  try {
    const partidas = await api.listarPartidas({ estado: 'en_curso', casoId });
    // Si la pantalla se volvió a dibujar mientras tanto, esta lista ya no se ve.
    if (!zona.isConnected) return;
    zona.replaceChildren(...[aviso, listaDePartidas(partidas, zona, casoId, contexto)].filter(Boolean));
  } catch (error) {
    if (!zona.isConnected) return;
    zona.replaceChildren(mensajeDeError(error, { reintentar: () => cargarPartidasEnCurso(zona, casoId, contexto) }));
  }
}

function listaDePartidas(partidas, zona, casoId, contexto) {
  if (partidas.length === 0) return mensajeVacio(t('partidas.vacio'));
  const actualId = contexto.juego.partida?.id ?? null;
  const zonaError = crear('div');
  const botones = [];

  const filas = partidas.map((partida) => {
    const esActual = partida.id === actualId;
    const datos = crear('div', {}, [
      crear('p', { clase: 'partida__titulo' }, [
        t('comun.partida', { id: partida.id }),
        // La partida actual se marca con texto, no solo con color.
        esActual ? crear('strong', { clase: 'partida__actual', texto: ` · ${t('partidas.actual')}` }) : null,
      ]),
      crear('p', { clase: 'meta' }, partes('partidas.iniciada', {
        fecha: crear('span', { clase: 'dato', texto: formatearMarcaUtc(partida.fechaInicio) }),
      })),
    ]);
    if (esActual) return crear('li', { clase: 'partida partida--actual', atributos: { 'aria-current': 'true' } }, [datos]);

    const retomar = crear('button', { clase: 'boton boton--secundario', atributos: { type: 'button' } }, [
      t('partidas.retomar'),
      crear('span', { clase: 'solo-lectores', texto: ` ${t('partidas.retomarDetalle', { id: partida.id })}` }),
    ]);
    botones.push(retomar);
    retomar.addEventListener('click', async () => {
      zonaError.replaceChildren();
      const otros = botones.filter((boton) => boton !== retomar);
      try {
        const retomada = await mientrasEspera(retomar, t('partidas.retomando'), () => contexto.retomarPartida(partida.id), otros);
        if (retomada === null) {
          // La API dice que ya terminó (por ejemplo, se arrestó en otra pestaña): se actualiza la lista.
          const aviso = crear('p', { clase: 'aviso', texto: t('partidas.yaTermino', { id: partida.id }), atributos: { role: 'status' } });
          cargarPartidasEnCurso(zona, casoId, contexto, aviso);
        }
      } catch (error) {
        zonaError.replaceChildren(mensajeDeError(error));
      }
    });
    return crear('li', { clase: 'partida' }, [datos, retomar]);
  });

  const fragmento = document.createDocumentFragment();
  fragmento.append(crear('ul', { clase: 'lista-partidas' }, filas), zonaError);
  return fragmento;
}

function seccionDeSospechosos(sospechosos) {
  const idTitulo = nuevoId('sospechosos');
  const lista = sospechosos.length === 0
    ? mensajeVacio(t('expediente.sinSospechosos'))
    : crear('ul', { clase: 'lista-sospechosos' }, sospechosos.map((sospechoso) => crear('li', {}, [
      crear('div', {}, [
        crear('h3', { texto: sospechoso.nombre }),
        crear('p', { clase: 'meta', texto: traducirContenido(sospechoso.relacionVictima) }),
      ]),
      crearFicha([
        [t('expediente.coartada'), crear('span', { clase: 'cita', texto: traducirContenido(sospechoso.coartada) })],
        [t('expediente.lugarYHorario'), t('expediente.lugarYRango', {
          lugar: traducirContenido(sospechoso.lugarCoartada),
          rango: formatearRango(sospechoso.coartadaDesde, sospechoso.coartadaHasta),
        })],
      ]),
    ])));

  return crear('section', { clase: 'seccion', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h2', { texto: t('expediente.sospechosos'), atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta', texto: t('expediente.personasInvestigadas', { cantidad: sospechosos.length }) }),
    lista,
  ]);
}
