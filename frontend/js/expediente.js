// Pantalla 1 — Expediente (modo lectura): título y descripción del crimen,
// fecha y lugar, inicio de la partida y lista de sospechosos. Todo sale de la
// API; los datos de cada caso se piden una sola vez.

import * as api from './api.js';
import {
  contar,
  crear,
  crearFicha,
  formatearFecha,
  formatearRango,
  mensajeDeCarga,
  mensajeDeError,
  mensajeVacio,
  mientrasEspera,
  nuevoId,
  textoLegible,
} from './dom.js';

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
      contenido.replaceChildren(mensajeDeCarga('Cargando el expediente…'));
      casos = await api.listarCasos();
    }
    if (casos.length === 0) {
      titulo.textContent = 'Expediente';
      contenido.replaceChildren(mensajeVacio(
        'No hay casos cargados en la base de datos. Ejecute npm run db:init y recargue la página.',
      ));
      return;
    }

    const casoId = casoElegidoId ?? contexto.juego.partida?.casoId ?? casos[0].id;
    if (!expedientes.has(casoId)) {
      contenido.replaceChildren(mensajeDeCarga('Cargando el expediente…'));
      const [caso, sospechosos] = await Promise.all([api.obtenerCaso(casoId), api.listarSospechosos(casoId)]);
      expedientes.set(casoId, { caso, sospechosos });
    }
    if (solicitud !== ultimaSolicitud) return;

    const { caso, sospechosos } = expedientes.get(casoId);
    titulo.textContent = caso.titulo;
    contenido.replaceChildren(...[
      casos.length > 1 ? selectorDeCaso(casoId, seccion, contexto) : null,
      crear('p', { clase: 'entrada', texto: caso.descripcion }),
      seccionDeHechos(caso),
      inicioDePartida(caso.id, contexto),
      seccionDeSospechosos(sospechosos),
    ].filter(Boolean));
  } catch (error) {
    if (solicitud !== ultimaSolicitud) return;
    titulo.textContent = 'Expediente';
    contenido.replaceChildren(mensajeDeError(error, { reintentar: () => renderizar(seccion, contexto) }));
  }
}

/** Solo aparece si la base tiene más de un caso. */
function selectorDeCaso(casoId, seccion, contexto) {
  const id = nuevoId('caso');
  const selector = crear('select', { atributos: { id } }, casos.map((caso) => {
    const opcion = crear('option', { texto: caso.titulo, atributos: { value: caso.id } });
    opcion.selected = caso.id === casoId;
    return opcion;
  }));
  selector.addEventListener('change', () => {
    casoElegidoId = Number(selector.value);
    renderizar(seccion, contexto);
  });
  return crear('p', { clase: 'campo' }, [crear('label', { texto: 'Caso ', atributos: { for: id } }), selector]);
}

/** Fecha y ubicación del crimen: vienen de la escena principal del caso. */
function seccionDeHechos(caso) {
  const escena = caso.escenaPrincipal;
  const sinEscena = 'Sin escena principal registrada';
  return crear('section', { clase: 'seccion' }, [
    crear('h2', { texto: 'Hechos' }),
    crearFicha([
      ['Fecha y hora del crimen', escena ? formatearFecha(escena.horaSuceso) : sinEscena, escena !== null],
      ['Lugar', escena ? `${escena.lugar} (${textoLegible(escena.tipoLugar)})` : sinEscena],
      ['Apertura del expediente', formatearFecha(caso.fechaApertura), true],
      ['Estado del caso', textoLegible(caso.estado)],
    ]),
  ]);
}

function inicioDePartida(casoId, contexto) {
  const { partida } = contexto.juego;
  const enCurso = partida !== null && partida.casoId === casoId && partida.estado === 'en_curso';
  const zonaError = crear('div');

  const iniciar = crear('button', {
    clase: `boton ${enCurso ? 'boton--secundario' : 'boton--primario'}`,
    texto: enCurso ? 'Iniciar una partida nueva' : 'Iniciar partida',
    atributos: { type: 'button' },
  });
  iniciar.addEventListener('click', async () => {
    zonaError.replaceChildren();
    try {
      await mientrasEspera(iniciar, 'Iniciando partida…', () => contexto.iniciarPartida(casoId));
    } catch (error) {
      zonaError.replaceChildren(mensajeDeError(error));
    }
  });

  const botones = enCurso
    ? [crear('a', { clase: 'boton boton--primario', texto: 'Continuar la investigación', atributos: { href: '#investigacion' } }), iniciar]
    : [iniciar];
  const explicacion = enCurso
    ? `La partida n.º ${partida.id} está en curso.`
    : 'Al iniciar, la partida se registra en la base de datos y se habilitan la investigación y la acusación.';

  return crear('div', { clase: 'seccion' }, [
    crear('p', { clase: 'lectura', texto: explicacion }),
    crear('div', { clase: 'acciones' }, botones),
    zonaError,
  ]);
}

function seccionDeSospechosos(sospechosos) {
  const idTitulo = nuevoId('sospechosos');
  const lista = sospechosos.length === 0
    ? mensajeVacio('Este caso no tiene sospechosos registrados.')
    : crear('ul', { clase: 'lista-sospechosos' }, sospechosos.map((sospechoso) => crear('li', {}, [
      crear('div', {}, [
        crear('h3', { texto: sospechoso.nombre }),
        crear('p', { clase: 'meta', texto: sospechoso.relacionVictima }),
      ]),
      crearFicha([
        ['Coartada declarada', crear('span', { clase: 'cita', texto: sospechoso.coartada })],
        ['Lugar y horario', `${sospechoso.lugarCoartada}, ${formatearRango(sospechoso.coartadaDesde, sospechoso.coartadaHasta)}`],
      ]),
    ])));

  return crear('section', { clase: 'seccion', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h2', { texto: 'Sospechosos', atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta', texto: contar(sospechosos.length, 'persona investigada', 'personas investigadas') }),
    lista,
  ]);
}
