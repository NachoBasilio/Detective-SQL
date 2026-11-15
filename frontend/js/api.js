// Cliente de la API REST de Detective SQL. Una sola función hace las
// solicitudes: parsea el JSON y convierte cada respuesta de error en un
// ErrorDeApi con el mensaje que devolvió el servidor.

const BASE = '/api';

export class ErrorDeApi extends Error {
  /**
   * @param {string} mensaje mensaje para el jugador
   * @param {number} estado código HTTP, o 0 si el servidor no respondió
   */
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.estado = estado;
  }
}

async function solicitar(ruta, { metodo = 'GET', cuerpo } = {}) {
  const opciones = { method: metodo, headers: { Accept: 'application/json' } };
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, opciones);
  } catch {
    throw new ErrorDeApi(
      'No se pudo conectar con el servidor. Verifique que esté en ejecución (npm start) y vuelva a intentarlo.',
      0,
    );
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    datos = undefined;
  }

  if (!respuesta.ok) {
    const mensaje = typeof datos?.error === 'string' && datos.error !== ''
      ? datos.error
      : `El servidor respondió con un error (HTTP ${respuesta.status}).`;
    throw new ErrorDeApi(mensaje, respuesta.status);
  }
  if (datos === undefined) {
    throw new ErrorDeApi('El servidor devolvió una respuesta que no es JSON válido.', respuesta.status);
  }
  return datos;
}

const segmento = (id) => encodeURIComponent(String(id));

export const listarCasos = () => solicitar('/casos');
export const obtenerCaso = (casoId) => solicitar(`/casos/${segmento(casoId)}`);
export const listarSospechosos = (casoId) => solicitar(`/casos/${segmento(casoId)}/sospechosos`);
export const listarEscenas = (casoId) => solicitar(`/casos/${segmento(casoId)}/escenas`);
export const listarEvidencias = (escenaId) => solicitar(`/escenas/${segmento(escenaId)}/evidencias`);
export const listarInterrogatorios = (sospechosoId) => solicitar(`/sospechosos/${segmento(sospechosoId)}/interrogatorios`);
export const descartarCoartadas = (casoId) => solicitar(`/casos/${segmento(casoId)}/investigacion/coartadas`);
export const obtenerMatriz = (casoId) => solicitar(`/casos/${segmento(casoId)}/investigacion/matriz`);
export const crearPartida = (casoId) => solicitar('/partidas', { metodo: 'POST', cuerpo: { casoId } });
export const obtenerPartida = (partidaId) => solicitar(`/partidas/${segmento(partidaId)}`);
export const arrestar = (partidaId, sospechosoId) =>
  solicitar(`/partidas/${segmento(partidaId)}/arrestos`, { metodo: 'POST', cuerpo: { sospechosoId } });
