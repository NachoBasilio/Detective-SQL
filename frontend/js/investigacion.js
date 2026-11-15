// Pantalla 2 — Investigación (modo operación): escenas con sus evidencias,
// interrogatorios, descarte de coartadas y matriz de evidencias calculada en
// SQLite. Cada panel carga por separado: un error no bloquea a los demás.

import * as api from './api.js';
import {
  contar,
  crear,
  crearTabla,
  formatearFecha,
  mensajeDeCarga,
  mensajeDeError,
  mensajeVacio,
  nuevoId,
  textoLegible,
} from './dom.js';

let casoCargadoId = null;
let pestanasListas = false;

export function mostrar(seccion, contexto) {
  if (!pestanasListas) {
    activarPestanas(seccion.querySelector('[role="tablist"]'));
    pestanasListas = true;
  }

  const casoId = contexto.juego.partida.casoId;
  if (casoId === casoCargadoId) return;
  casoCargadoId = casoId;

  const panel = (nombre) => seccion.querySelector(`#panel-${nombre} .panel__contenido`);
  cargarPanel(panel('escenas'), casoId, contenidoDeEscenas, 'Cargando escenas y evidencias…');
  cargarPanel(panel('interrogatorios'), casoId, contenidoDeInterrogatorios, 'Cargando interrogatorios…');
  cargarPanel(panel('coartadas'), casoId, contenidoDeCoartadas, 'Ejecutando el descarte de coartadas…');
  cargarPanel(panel('matriz'), casoId, contenidoDeMatriz, 'Calculando la matriz de evidencias…');
}

async function cargarPanel(contenedor, casoId, obtenerContenido, textoDeCarga) {
  contenedor.replaceChildren(mensajeDeCarga(textoDeCarga));
  try {
    const nodos = await obtenerContenido(casoId);
    if (casoId === casoCargadoId) contenedor.replaceChildren(...nodos);
  } catch (error) {
    if (casoId !== casoCargadoId) return;
    contenedor.replaceChildren(mensajeDeError(error, {
      reintentar: () => cargarPanel(contenedor, casoId, obtenerContenido, textoDeCarga),
    }));
  }
}

/* Pestañas accesibles: clic, flechas izquierda y derecha, Inicio y Fin. */

function activarPestanas(lista) {
  const pestanas = [...lista.querySelectorAll('[role="tab"]')];

  function seleccionar(elegida) {
    for (const pestana of pestanas) {
      const activa = pestana === elegida;
      pestana.setAttribute('aria-selected', String(activa));
      pestana.tabIndex = activa ? 0 : -1;
      document.getElementById(pestana.getAttribute('aria-controls')).hidden = !activa;
    }
  }

  lista.addEventListener('click', (evento) => {
    const pestana = evento.target.closest('[role="tab"]');
    if (pestana) seleccionar(pestana);
  });
  lista.addEventListener('keydown', (evento) => {
    const actual = pestanas.indexOf(document.activeElement);
    if (actual === -1) return;
    const destinos = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: 0, End: pestanas.length - 1 };
    if (!Object.hasOwn(destinos, evento.key)) return;
    evento.preventDefault();
    const elegida = pestanas[(destinos[evento.key] + pestanas.length) % pestanas.length];
    seleccionar(elegida);
    elegida.focus();
  });
}

/* Escenas y evidencias */

async function contenidoDeEscenas(casoId) {
  const escenas = await api.listarEscenas(casoId);
  if (escenas.length === 0) return [mensajeVacio('Este caso no tiene escenas registradas.')];
  const evidencias = await Promise.all(escenas.map((escena) => api.listarEvidencias(escena.id)));
  return escenas.map((escena, indice) => bloqueDeEscena(escena, evidencias[indice]));
}

function bloqueDeEscena(escena, evidencias) {
  const idTitulo = nuevoId('escena');
  const detalles = [
    textoLegible(escena.tipoLugar),
    formatearFecha(escena.horaSuceso),
    contar(escena.cantidadEvidencias, 'evidencia', 'evidencias'),
  ].join(' · ');

  return crear('section', { clase: 'bloque', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h3', { texto: escena.lugar, atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta' }, [
      escena.esPrincipal ? crear('strong', { texto: 'Escena principal · ' }) : null,
      detalles,
    ]),
    evidencias.length === 0
      ? mensajeVacio('No se registraron evidencias en esta escena.')
      : crearTabla({
        titulo: `Evidencias encontradas en ${escena.lugar}`,
        clase: 'tabla--evidencias',
        columnas: [
          { titulo: 'N.º', clase: 'num' },
          { titulo: 'Tipo' },
          { titulo: 'Descripción', clase: 'texto-largo' },
          { titulo: 'Relevancia', clase: 'num' },
          { titulo: 'Lugar acreditado' },
          { titulo: 'Hora del indicio', clase: 'dato' },
          { titulo: 'Vínculos con sospechosos', clase: 'texto-largo' },
        ],
        // El lugar acreditado es donde ocurrió el hecho que prueba la evidencia;
        // puede diferir de la escena donde se encontró (por ejemplo, un ticket).
        filas: evidencias.map((evidencia) => [
          evidencia.id,
          textoLegible(evidencia.tipo),
          evidencia.descripcion,
          evidencia.relevancia,
          evidencia.lugarAcreditado ?? 'Sin lugar acreditado',
          evidencia.horaIndicio === null ? 'Sin hora' : formatearFecha(evidencia.horaIndicio),
          listaDeVinculos(evidencia.vinculos),
        ]),
      }),
  ]);
}

const CLASES_DE_VINCULO = new Map([
  ['incrimina', 'vinculo--incrimina'],
  ['exculpa', 'vinculo--exculpa'],
  ['presencia', 'vinculo--presencia'],
]);

/** El tipo de vínculo siempre se escribe: el color solo lo refuerza. */
function listaDeVinculos(vinculos) {
  if (vinculos.length === 0) return crear('span', { clase: 'meta', texto: 'Sin vínculos con sospechosos' });
  return crear('ul', { clase: 'vinculos' }, vinculos.map((vinculo) => crear('li', {}, [
    crear('span', { texto: `${vinculo.nombre}: ` }),
    crear('span', {
      clase: ['vinculo', CLASES_DE_VINCULO.get(vinculo.tipoVinculo)].filter(Boolean).join(' '),
      texto: textoLegible(vinculo.tipoVinculo),
    }),
    crear('span', { clase: 'dato', texto: ` (peso ${vinculo.peso})` }),
    vinculo.observaciones ? crear('p', { clase: 'meta', texto: vinculo.observaciones }) : null,
  ])));
}

/* Interrogatorios */

async function contenidoDeInterrogatorios(casoId) {
  const sospechosos = await api.listarSospechosos(casoId);
  if (sospechosos.length === 0) return [mensajeVacio('Este caso no tiene sospechosos registrados.')];
  const interrogatorios = await Promise.all(sospechosos.map((sospechoso) => api.listarInterrogatorios(sospechoso.id)));
  return sospechosos.map((sospechoso, indice) => bloqueDeInterrogatorios(sospechoso, interrogatorios[indice]));
}

function bloqueDeInterrogatorios(sospechoso, interrogatorios) {
  const idTitulo = nuevoId('interrogatorios');
  return crear('section', { clase: 'bloque', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h3', { texto: sospechoso.nombre, atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta', texto: sospechoso.relacionVictima }),
    interrogatorios.length === 0
      ? mensajeVacio('No hay interrogatorios registrados para este sospechoso.')
      : crearTabla({
        titulo: `Interrogatorios de ${sospechoso.nombre}`,
        columnas: [
          { titulo: 'Fecha y hora', clase: 'dato' },
          { titulo: 'Declaración', clase: 'texto-largo' },
          { titulo: 'Contradicción detectada', clase: 'texto-largo' },
        ],
        filas: interrogatorios.map((interrogatorio) => [
          formatearFecha(interrogatorio.fechaHora),
          interrogatorio.declaracion,
          interrogatorio.contradiccion ?? 'Sin contradicción registrada',
        ]),
      }),
  ]);
}

/* Descarte de coartadas */

async function contenidoDeCoartadas(casoId) {
  const coartadas = await api.descartarCoartadas(casoId);
  if (coartadas.length === 0) return [mensajeVacio('Ninguna evidencia contradice las coartadas declaradas.')];
  return [crearTabla({
    titulo: 'Coartadas contradichas por evidencias',
    columnas: [
      { titulo: 'Sospechoso' },
      { titulo: 'Lugar declarado' },
      { titulo: 'Lugar observado' },
      { titulo: 'Hora del indicio', clase: 'dato' },
      { titulo: 'Evidencia N.º', clase: 'num' },
    ],
    filas: coartadas.map((fila) => [
      fila.nombre,
      fila.lugarDeclarado,
      fila.lugarObservado,
      formatearFecha(fila.horaIndicio),
      fila.evidenciaId,
    ]),
  })];
}

/* Matriz de evidencias */

async function contenidoDeMatriz(casoId) {
  const matriz = await api.obtenerMatriz(casoId);
  if (matriz.length === 0) return [mensajeVacio('La matriz no tiene filas para este caso.')];
  return [crearTabla({
    titulo: 'Matriz de evidencias por sospechoso',
    columnas: [
      { titulo: 'Sospechoso' },
      { titulo: 'Evidencias incriminatorias', clase: 'num' },
      { titulo: 'Peso incriminatorio', clase: 'num' },
      { titulo: 'Vínculos de presencia', clase: 'num' },
      { titulo: 'Peso exculpatorio', clase: 'num' },
    ],
    filas: matriz.map((fila) => [
      fila.nombre,
      fila.cantidadIncriminatorias,
      fila.pesoIncriminatorio,
      fila.cantidadPresencias,
      fila.pesoExculpatorio,
    ]),
  })];
}
