// Cliente de la API REST de Detective SQL. Una sola función hace las
// solicitudes: parsea el JSON y convierte cada respuesta de error en un
// ErrorDeApi con el mensaje que devolvió el servidor. La API responde en
// español; la interfaz traduce el mensaje al mostrarlo (ver dom.js).

const BASE = '/api';

export class ErrorDeApi extends Error {
  /**
   * @param {string} mensaje mensaje del servidor, o el texto en español del error propio del cliente
   * @param {number} estado código HTTP, o 0 si el servidor no respondió
   * @param {{ clave?: string, parametros?: Record<string, unknown> }} [traduccion]
   *   clave del catálogo para los errores que detecta el cliente
   */
  constructor(mensaje, estado, { clave, parametros } = {}) {
    super(mensaje);
    this.name = 'ErrorDeApi';
    this.estado = estado;
    if (clave !== undefined) {
      this.clave = clave;
      this.parametros = parametros ?? {};
    }
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
      { clave: 'errores.sinConexion' },
    );
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    datos = undefined;
  }

  if (!respuesta.ok) {
    if (typeof datos?.error === 'string' && datos.error !== '') throw new ErrorDeApi(datos.error, respuesta.status);
    throw new ErrorDeApi(
      `El servidor respondió con un error (HTTP ${respuesta.status}).`,
      respuesta.status,
      { clave: 'errores.http', parametros: { estado: respuesta.status } },
    );
  }
  if (datos === undefined) {
    throw new ErrorDeApi(
      'El servidor devolvió una respuesta que no es JSON válido.',
      respuesta.status,
      { clave: 'errores.jsonInvalido' },
    );
  }
  return datos;
}

const segmento = (id) => encodeURIComponent(String(id));

/** Query string con los filtros definidos; los valores van codificados por URLSearchParams. */
function consulta(filtros) {
  const parametros = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null) parametros.set(nombre, String(valor));
  }
  const texto = parametros.toString();
  return texto === '' ? '' : `?${texto}`;
}

export const listarCasos = () => solicitar('/casos');
export const obtenerCaso = (casoId) => solicitar(`/casos/${segmento(casoId)}`);
export const listarSospechosos = (casoId) => solicitar(`/casos/${segmento(casoId)}/sospechosos`);
export const listarEscenas = (casoId) => solicitar(`/casos/${segmento(casoId)}/escenas`);
export const listarEvidencias = (escenaId) => solicitar(`/escenas/${segmento(escenaId)}/evidencias`);
export const listarInterrogatorios = (sospechosoId) => solicitar(`/sospechosos/${segmento(sospechosoId)}/interrogatorios`);
export const descartarCoartadas = (casoId) => solicitar(`/casos/${segmento(casoId)}/investigacion/coartadas`);
export const obtenerMatriz = (casoId) => solicitar(`/casos/${segmento(casoId)}/investigacion/matriz`);
export const listarPartidas = ({ estado, casoId } = {}) => solicitar(`/partidas${consulta({ estado, casoId })}`);
export const crearPartida = (casoId) => solicitar('/partidas', { metodo: 'POST', cuerpo: { casoId } });
export const obtenerPartida = (partidaId) => solicitar(`/partidas/${segmento(partidaId)}`);
export const arrestar = (partidaId, sospechosoId) =>
  solicitar(`/partidas/${segmento(partidaId)}/arrestos`, { metodo: 'POST', cuerpo: { sospechosoId } });
