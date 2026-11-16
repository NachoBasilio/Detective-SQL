// Traducción de los datos que llegan de la API. La base y la API siguen en
// español: el frontend traduce solo lo que muestra.
// - ENUMERADOS: valores fijos de la base (CHECK) y el resultado del arresto.
// - CONTENIDO_EN: textos libres de la semilla, por su texto exacto en español.
//   Si un texto no está, se muestra el original. Los nombres de personas no se
//   traducen; los nombres descriptivos de lugares, sí.
// - ERRORES_DE_API_EN: mensajes de error que devuelve el backend.
// Solo se incluyen textos que la API ya expone antes del arresto o en su
// respuesta: este archivo no agrega ningún dato sobre el culpable.
// Módulo puro: se puede importar desde Node.js, no toca el DOM.

export const ENUMERADOS = Object.freeze({
  es: Object.freeze({
    estadoCaso: Object.freeze({ abierto: 'abierto', resuelto: 'resuelto' }),
    estadoPartida: Object.freeze({ en_curso: 'en curso', ganada: 'ganada', perdida: 'perdida' }),
    resultado: Object.freeze({ correcto: 'correcto', incorrecto: 'incorrecto' }),
    tipoEvidencia: Object.freeze({ huella: 'huella', ADN: 'ADN', objeto: 'objeto', registro_digital: 'registro digital' }),
    tipoVinculo: Object.freeze({ incrimina: 'incrimina', exculpa: 'exculpa', presencia: 'presencia' }),
    tipoLugar: Object.freeze({
      oficina: 'oficina',
      estacionamiento: 'estacionamiento',
      cafeteria: 'cafetería',
      hospital: 'hospital',
      vivienda: 'vivienda',
      restaurante: 'restaurante',
      gimnasio: 'gimnasio',
    }),
  }),
  en: Object.freeze({
    estadoCaso: Object.freeze({ abierto: 'open', resuelto: 'solved' }),
    estadoPartida: Object.freeze({ en_curso: 'ongoing', ganada: 'won', perdida: 'lost' }),
    resultado: Object.freeze({ correcto: 'correct', incorrecto: 'incorrect' }),
    tipoEvidencia: Object.freeze({ huella: 'fingerprint', ADN: 'DNA', objeto: 'object', registro_digital: 'digital record' }),
    tipoVinculo: Object.freeze({ incrimina: 'incriminates', exculpa: 'exculpates', presencia: 'presence' }),
    tipoLugar: Object.freeze({
      oficina: 'office',
      estacionamiento: 'parking lot',
      cafeteria: 'café',
      hospital: 'hospital',
      vivienda: 'residence',
      restaurante: 'restaurant',
      gimnasio: 'gym',
    }),
  }),
});

export const CONTENIDO_EN = Object.freeze({
  // caso
  'El silencio del archivo': 'The Silence of the Archive',
  'La directora del archivo municipal fue asesinada a las 21:30. Cuatro personas mintieron sobre su ubicación. Solo una cometió el crimen.':
    'The director of the municipal archive was murdered at 21:30. Four people lied about where they were. Only one of them committed the crime.',

  // lugar
  'Archivo municipal': 'Municipal archive',
  'Estacionamiento municipal': 'Municipal parking lot',
  'Cafe Bahia': 'Cafe Bahia',
  'Hospital Central': 'Central Hospital',
  'Domicilio de Bruno': 'Bruno’s home',
  'Restaurante Central': 'Central Restaurant',
  'Gimnasio Norte': 'North Gym',

  // sospechoso: coartada y relación con la víctima
  'Afirmo que estuvo en el hospital toda la noche.': 'Claimed to have been at the hospital all night.',
  'Afirmo que estuvo en su casa desde las 21:00.': 'Claimed to have been at home from 21:00 onwards.',
  'Afirmo que ceno en un restaurante entre las 21:00 y las 22:00.': 'Claimed to have had dinner at a restaurant between 21:00 and 22:00.',
  'Afirmo que estuvo entrenando en el gimnasio.': 'Claimed to have been working out at the gym.',
  'Hermana de la victima': 'The victim’s sister',
  'Exsocio de la victima': 'The victim’s former business partner',
  'Empleada del archivo': 'Archive employee',
  'Proveedor del archivo': 'Archive supplier',

  // evidencia
  'Huella sobre el arma, identificable y compatible con una persona investigada.':
    'Fingerprint on the weapon, identifiable and matching one of the people under investigation.',
  'Acceso con credencial personal registrado a las 21:29.': 'Entry with a personal ID badge logged at 21:29.',
  'Rastro biologico en un guante descartado junto a la victima.': 'Biological trace on a glove discarded next to the victim.',
  'Fragmento del identificador de acceso encontrado junto al cuerpo.': 'Fragment of an access badge found next to the body.',
  'Camara del estacionamiento a las 21:19.': 'Parking lot camera at 21:19.',
  'Camara del estacionamiento a las 21:22.': 'Parking lot camera at 21:22.',
  'Pago electronico en Cafe Bahia a las 21:08.': 'Electronic payment at Cafe Bahia at 21:08.',
  'Huella en el acceso del archivo correspondiente a una visita anterior.': 'Fingerprint at the archive entrance left during an earlier visit.',
  'Ticket de estacionamiento sin identidad asociada.': 'Parking ticket with no identity attached.',
  'Nota manuscrita abandonada en una mesa.': 'Handwritten note left behind on a table.',
  'Pagare impago firmado a favor de la victima, con una amenaza escrita al dorso.':
    'Unpaid promissory note made out to the victim, with a threat written on the back.',
  'Huella en el picaporte de la oficina de la directora.': 'Fingerprint on the door handle of the director’s office.',
  'Colilla de cigarrillo en el cenicero de la oficina.': 'Cigarette butt in the office ashtray.',
  'Mensaje de texto amenazante en el telefono de la victima, recibido a las 20:55.':
    'Threatening text message on the victim’s phone, received at 20:55.',
  'Camara de seguridad de Cafe Bahia que muestra a un cliente sentado en una mesa a las 21:30.':
    'Cafe Bahia security camera showing a customer sitting at a table at 21:30.',
  'Testamento de la victima que nombra a su hermana como unica heredera.': 'The victim’s will, naming her sister as sole heir.',
  'Camara del estacionamiento que muestra a una mujer todavia dentro de su auto a las 21:30.':
    'Parking lot camera showing a woman still inside her car at 21:30.',
  'Ticket de Restaurante Central de las 21:12 encontrado en el escritorio de una empleada.':
    'Central Restaurant receipt from 21:12 found on an employee’s desk.',

  // sospechoso_evidencia: observaciones de cada vínculo
  'La huella corresponde a Carla y aparece en el arma.': 'The fingerprint is Carla’s and it is on the weapon.',
  'La credencial de Carla abrio el archivo un minuto antes del crimen.': 'Carla’s badge opened the archive one minute before the crime.',
  'El ADN recuperado es compatible con Carla.': 'The recovered DNA matches Carla.',
  'El identificador roto pertenece a Carla.': 'The broken badge belongs to Carla.',
  'La camara sitúa a Elisa fuera del hospital durante su coartada.': 'The camera places Elisa outside the hospital during her alibi.',
  'La camara sitúa a Diego fuera del gimnasio durante su coartada.': 'The camera places Diego outside the gym during his alibi.',
  'El pago sitúa a Bruno fuera de su domicilio durante su coartada.': 'The payment places Bruno away from home during his alibi.',
  'Elisa estuvo en el archivo antes del periodo declarado; no prueba presencia al cometerse el crimen.':
    'Elisa was at the archive before the stated period; it does not prove she was there when the crime was committed.',
  'Bruno firmo el pagare y escribio la amenaza: le debia dinero a la victima.':
    'Bruno signed the promissory note and wrote the threat: he owed the victim money.',
  'La huella del picaporte es de Bruno, aunque no permite saber cuando la dejo.':
    'The fingerprint on the door handle is Bruno’s, although there is no way to tell when he left it.',
  'El ADN de la colilla es compatible con Bruno, que fumaba en sus reuniones con la victima.':
    'The DNA on the cigarette butt matches Bruno, who used to smoke during his meetings with the victim.',
  'Bruno envio el mensaje amenazante a las 20:55, media hora antes del crimen.':
    'Bruno sent the threatening message at 20:55, half an hour before the crime.',
  'El cliente de la camara es Bruno: estaba en Cafe Bahia a la hora del crimen.':
    'The customer on camera is Bruno: he was at Cafe Bahia at the time of the crime.',
  'Elisa hereda los bienes de la victima: tiene un motivo, pero nada la ubica en la escena.':
    'Elisa inherits the victim’s estate: she has a motive, but nothing places her at the scene.',
  'La mujer del auto es Elisa: seguia en el estacionamiento a la hora del crimen.':
    'The woman in the car is Elisa: she was still in the parking lot at the time of the crime.',
  'El ticket es de Carla y respalda su coartada, pero solo hasta las 21:12.':
    'The receipt is Carla’s and supports her alibi, but only until 21:12.',

  // interrogatorio: declaraciones y contradicciones
  'No abandone el hospital entre las 21:00 y las 22:00.': 'I did not leave the hospital between 21:00 and 22:00.',
  'No sali de mi casa despues de las 21:00.': 'I did not leave my house after 21:00.',
  'No entre al archivo esa noche.': 'I did not go into the archive that night.',
  'Me quede en el gimnasio hasta las 22:00.': 'I stayed at the gym until 22:00.',
  'Admito que menti: estuve en Cafe Bahia desde las 21:05 hasta pasadas las 21:30.':
    'I admit I lied: I was at Cafe Bahia from 21:05 until after 21:30.',
  'Una camara registra a Elisa en el estacionamiento a las 21:19.': 'A camera records Elisa in the parking lot at 21:19.',
  'Una compra confirmada la ubica en Cafe Bahia a las 21:08.': 'A confirmed purchase places the suspect at Cafe Bahia at 21:08.',
  'Su credencial abre el archivo a las 21:29 y se hallan pruebas materiales.':
    'The suspect’s badge opens the archive at 21:29, and physical evidence is found.',
  'Una camara registra a Diego en el estacionamiento a las 21:22.': 'A camera records Diego in the parking lot at 21:22.',
});

export const ERRORES_DE_API_EN = Object.freeze({
  'El identificador debe ser un número entero positivo.': 'The identifier must be a positive integer.',
  'El campo casoId es obligatorio y debe ser un número entero positivo.': 'The casoId field is required and must be a positive integer.',
  'El campo sospechosoId es obligatorio y debe ser un número entero positivo.': 'The sospechosoId field is required and must be a positive integer.',
  'El parámetro casoId debe ser un número entero positivo.': 'The casoId parameter must be a positive integer.',
  'El parámetro estado debe indicarse una sola vez.': 'The estado parameter must be given only once.',
  'El caso no existe.': 'The case does not exist.',
  'La escena no existe.': 'The scene does not exist.',
  'El sospechoso no existe.': 'The suspect does not exist.',
  'La partida no existe.': 'The game does not exist.',
  'La partida ya terminó: solo se permite un arresto por partida.': 'This game has already ended: only one arrest is allowed per game.',
  'El sospechoso no pertenece al caso de la partida.': 'The suspect does not belong to this game’s case.',
  'El cuerpo de la solicitud debe ser un JSON válido.': 'The request body must be valid JSON.',
  'La solicitud no es válida.': 'The request is not valid.',
  'La ruta solicitada no existe en la API.': 'The requested route does not exist in the API.',
  'Error interno del servidor.': 'Internal server error.',
});
