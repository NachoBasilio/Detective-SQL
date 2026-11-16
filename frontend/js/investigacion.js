// Pantalla 2 — Investigación (modo operación): escenas con sus evidencias,
// interrogatorios, descarte de coartadas y matriz de evidencias calculada en
// SQLite. Cada panel carga por separado: un error no bloquea a los demás. Los
// datos dependen solo del caso, así que cambiar a otra partida del mismo caso
// no los vuelve a pedir.

import * as api from './api.js';
import { crear, crearTabla, mensajeDeCarga, mensajeDeError, mensajeVacio, nuevoId } from './dom.js';
import { formatearFecha, t, traducirContenido, traducirEnum } from './i18n/traductor.js';
import { activarPestanas } from './pestanas.js';

let casoCargadoId = null;
let pestanasListas = false;

export function mostrar(seccion, contexto) {
  if (!pestanasListas) {
    activarPestanas(seccion.querySelector('[role="tablist"]'), seccion.querySelector('.paneles'));
    pestanasListas = true;
  }

  const casoId = contexto.juego.partida.casoId;
  if (casoId === casoCargadoId) return;
  casoCargadoId = casoId;

  const panel = (nombre) => seccion.querySelector(`#panel-${nombre} .panel__contenido`);
  cargarPanel(panel('escenas'), casoId, contenidoDeEscenas, 'investigacion.cargandoEscenas');
  cargarPanel(panel('interrogatorios'), casoId, contenidoDeInterrogatorios, 'investigacion.cargandoInterrogatorios');
  cargarPanel(panel('coartadas'), casoId, contenidoDeCoartadas, 'investigacion.cargandoCoartadas');
  cargarPanel(panel('matriz'), casoId, contenidoDeMatriz, 'investigacion.cargandoMatriz');
}

/** Al cambiar el idioma, los paneles se vuelven a dibujar la próxima vez que se muestre la pantalla. */
export function invalidar() {
  casoCargadoId = null;
}

async function cargarPanel(contenedor, casoId, obtenerContenido, claveDeCarga) {
  contenedor.replaceChildren(mensajeDeCarga(t(claveDeCarga)));
  try {
    const nodos = await obtenerContenido(casoId);
    if (casoId === casoCargadoId) contenedor.replaceChildren(...nodos);
  } catch (error) {
    if (casoId !== casoCargadoId) return;
    contenedor.replaceChildren(mensajeDeError(error, {
      reintentar: () => cargarPanel(contenedor, casoId, obtenerContenido, claveDeCarga),
    }));
  }
}

/* Escenas y evidencias */

async function contenidoDeEscenas(casoId) {
  const escenas = await api.listarEscenas(casoId);
  if (escenas.length === 0) return [mensajeVacio(t('investigacion.sinEscenas'))];
  const evidencias = await Promise.all(escenas.map((escena) => api.listarEvidencias(escena.id)));
  return escenas.map((escena, indice) => bloqueDeEscena(escena, evidencias[indice]));
}

function bloqueDeEscena(escena, evidencias) {
  const idTitulo = nuevoId('escena');
  const lugar = traducirContenido(escena.lugar);
  const detalles = [
    traducirEnum('tipoLugar', escena.tipoLugar),
    formatearFecha(escena.horaSuceso),
    t('investigacion.evidencias', { cantidad: escena.cantidadEvidencias }),
  ].join(' · ');

  return crear('section', { clase: 'bloque', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h3', { texto: lugar, atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta' }, [
      escena.esPrincipal ? crear('strong', { texto: `${t('investigacion.escenaPrincipal')} · ` }) : null,
      detalles,
    ]),
    evidencias.length === 0
      ? mensajeVacio(t('investigacion.sinEvidencias'))
      : crearTabla({
        titulo: t('investigacion.tablaEvidencias', { lugar }),
        clase: 'tabla--evidencias',
        columnas: [
          { titulo: t('columna.numero'), clase: 'num' },
          { titulo: t('columna.tipo') },
          { titulo: t('columna.descripcion'), clase: 'texto-largo' },
          { titulo: t('columna.relevancia'), clase: 'num' },
          { titulo: t('columna.lugarAcreditado') },
          { titulo: t('columna.horaIndicio'), clase: 'dato' },
          { titulo: t('columna.vinculos'), clase: 'texto-largo' },
        ],
        // El lugar acreditado es donde ocurrió el hecho que prueba la evidencia;
        // puede diferir de la escena donde se encontró (por ejemplo, un ticket).
        filas: evidencias.map((evidencia) => [
          evidencia.id,
          traducirEnum('tipoEvidencia', evidencia.tipo),
          traducirContenido(evidencia.descripcion),
          evidencia.relevancia,
          evidencia.lugarAcreditado === null ? t('investigacion.sinLugar') : traducirContenido(evidencia.lugarAcreditado),
          evidencia.horaIndicio === null ? t('investigacion.sinHora') : formatearFecha(evidencia.horaIndicio),
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
  if (vinculos.length === 0) return crear('span', { clase: 'meta', texto: t('investigacion.sinVinculos') });
  return crear('ul', { clase: 'vinculos' }, vinculos.map((vinculo) => crear('li', {}, [
    crear('span', { texto: `${vinculo.nombre}: ` }),
    crear('span', {
      clase: ['vinculo', CLASES_DE_VINCULO.get(vinculo.tipoVinculo)].filter(Boolean).join(' '),
      texto: traducirEnum('tipoVinculo', vinculo.tipoVinculo),
    }),
    ' ',
    crear('span', { clase: 'dato', texto: t('investigacion.peso', { peso: vinculo.peso }) }),
    vinculo.observaciones ? crear('p', { clase: 'meta', texto: traducirContenido(vinculo.observaciones) }) : null,
  ])));
}

/* Interrogatorios */

async function contenidoDeInterrogatorios(casoId) {
  const sospechosos = await api.listarSospechosos(casoId);
  if (sospechosos.length === 0) return [mensajeVacio(t('expediente.sinSospechosos'))];
  const interrogatorios = await Promise.all(sospechosos.map((sospechoso) => api.listarInterrogatorios(sospechoso.id)));
  return sospechosos.map((sospechoso, indice) => bloqueDeInterrogatorios(sospechoso, interrogatorios[indice]));
}

function bloqueDeInterrogatorios(sospechoso, interrogatorios) {
  const idTitulo = nuevoId('interrogatorios');
  return crear('section', { clase: 'bloque', atributos: { 'aria-labelledby': idTitulo } }, [
    crear('h3', { texto: sospechoso.nombre, atributos: { id: idTitulo } }),
    crear('p', { clase: 'meta', texto: traducirContenido(sospechoso.relacionVictima) }),
    interrogatorios.length === 0
      ? mensajeVacio(t('investigacion.sinInterrogatorios'))
      : crearTabla({
        titulo: t('investigacion.tablaInterrogatorios', { nombre: sospechoso.nombre }),
        columnas: [
          { titulo: t('columna.fechaHora'), clase: 'dato' },
          { titulo: t('columna.declaracion'), clase: 'texto-largo' },
          { titulo: t('columna.contradiccion'), clase: 'texto-largo' },
        ],
        filas: interrogatorios.map((interrogatorio) => [
          formatearFecha(interrogatorio.fechaHora),
          traducirContenido(interrogatorio.declaracion),
          interrogatorio.contradiccion === null
            ? t('investigacion.sinContradiccion')
            : traducirContenido(interrogatorio.contradiccion),
        ]),
      }),
  ]);
}

/* Descarte de coartadas */

async function contenidoDeCoartadas(casoId) {
  const coartadas = await api.descartarCoartadas(casoId);
  if (coartadas.length === 0) return [mensajeVacio(t('investigacion.sinCoartadasDescartadas'))];
  return [crearTabla({
    titulo: t('investigacion.tablaCoartadas'),
    columnas: [
      { titulo: t('columna.sospechoso') },
      { titulo: t('columna.lugarDeclarado') },
      { titulo: t('columna.lugarObservado') },
      { titulo: t('columna.horaIndicio'), clase: 'dato' },
      { titulo: t('columna.evidenciaNumero'), clase: 'num' },
    ],
    filas: coartadas.map((fila) => [
      fila.nombre,
      traducirContenido(fila.lugarDeclarado),
      traducirContenido(fila.lugarObservado),
      formatearFecha(fila.horaIndicio),
      fila.evidenciaId,
    ]),
  })];
}

/* Matriz de evidencias */

async function contenidoDeMatriz(casoId) {
  const matriz = await api.obtenerMatriz(casoId);
  if (matriz.length === 0) return [mensajeVacio(t('investigacion.matrizVacia'))];
  return [crearTabla({
    titulo: t('investigacion.tablaMatriz'),
    columnas: [
      { titulo: t('columna.sospechoso') },
      { titulo: t('columna.incriminatorias'), clase: 'num' },
      { titulo: t('columna.pesoIncriminatorio'), clase: 'num' },
      { titulo: t('columna.presencias'), clase: 'num' },
      { titulo: t('columna.pesoExculpatorio'), clase: 'num' },
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
