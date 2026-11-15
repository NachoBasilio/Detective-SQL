-- DETECTIVE SQL - Esquema, datos semilla y consultas académicas
-- SQLite 3.35+; aplicar este archivo a una base vacía.
-- Advertencia: el script incluye consultas de investigación y ejemplos transaccionales.
-- La aplicación debe ejecutar PRAGMA foreign_keys = ON en CADA conexión.
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. DDL: nueve tablas y restricciones de integridad
-- ============================================================
CREATE TABLE caso (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    fecha_apertura TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierto'
        CHECK (estado IN ('abierto', 'resuelto'))
);

-- Regla del dominio: cada lugar tiene un único tipo. Escenas y coartadas
-- referencian el lugar por identificador para poder compararlas.
CREATE TABLE lugar (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    tipo_lugar TEXT NOT NULL
);

CREATE TABLE sospechoso (
    id INTEGER PRIMARY KEY,
    caso_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    coartada TEXT NOT NULL,
    lugar_coartada_id INTEGER NOT NULL,
    coartada_desde TEXT NOT NULL,
    coartada_hasta TEXT NOT NULL,
    relacion_victima TEXT NOT NULL,
    es_culpable INTEGER NOT NULL DEFAULT 0 CHECK (es_culpable IN (0, 1)),
    CONSTRAINT uq_sospechoso_nombre UNIQUE (caso_id, nombre),
    CONSTRAINT ck_coartada_fechas CHECK (coartada_desde <= coartada_hasta),
    FOREIGN KEY (caso_id) REFERENCES caso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lugar_coartada_id) REFERENCES lugar(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Garantiza a lo sumo un culpable por caso. Que exista exactamente uno no lo
-- impone el índice: lo valida la inicialización (validarCasosJugables en
-- backend/database/crear-base.js) y lo comprueban los tests.
CREATE UNIQUE INDEX uq_un_culpable_por_caso
    ON sospechoso(caso_id) WHERE es_culpable = 1;

CREATE TABLE escena (
    id INTEGER PRIMARY KEY,
    caso_id INTEGER NOT NULL,
    lugar_id INTEGER NOT NULL,
    hora_suceso TEXT NOT NULL,
    es_principal INTEGER NOT NULL DEFAULT 0 CHECK (es_principal IN (0, 1)),
    FOREIGN KEY (caso_id) REFERENCES caso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lugar_id) REFERENCES lugar(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Como máximo una escena principal por caso.
CREATE UNIQUE INDEX uq_escena_principal_por_caso
    ON escena(caso_id) WHERE es_principal = 1;

-- escena_id es la escena donde se encontró la prueba. lugar_acreditado_id y
-- hora_indicio describen el hecho que la prueba demuestra (dónde y cuándo
-- ocurrió), si se conocen. Una prueba hallada en una escena puede acreditar
-- un hecho ocurrido en otro lugar, o no acreditar ningún lugar.
CREATE TABLE evidencia (
    id INTEGER PRIMARY KEY,
    escena_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('huella', 'ADN', 'objeto', 'registro_digital')),
    descripcion TEXT NOT NULL,
    relevancia INTEGER NOT NULL CHECK (relevancia BETWEEN 1 AND 5),
    hora_indicio TEXT, -- Hora demostrada del hecho, si la prueba permite conocerla.
    lugar_acreditado_id INTEGER, -- Lugar del hecho demostrado, si la prueba lo permite conocer.
    FOREIGN KEY (escena_id) REFERENCES escena(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lugar_acreditado_id) REFERENCES lugar(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE sospechoso_evidencia (
    sospechoso_id INTEGER NOT NULL,
    evidencia_id INTEGER NOT NULL,
    tipo_vinculo TEXT NOT NULL
        CHECK (tipo_vinculo IN ('incrimina', 'exculpa', 'presencia')),
    peso INTEGER NOT NULL CHECK (peso BETWEEN 1 AND 5),
    observaciones TEXT NOT NULL,
    PRIMARY KEY (sospechoso_id, evidencia_id),
    FOREIGN KEY (sospechoso_id) REFERENCES sospechoso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (evidencia_id) REFERENCES evidencia(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE interrogatorio (
    id INTEGER PRIMARY KEY,
    sospechoso_id INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL,
    declaracion TEXT NOT NULL,
    contradiccion_detectada TEXT,
    FOREIGN KEY (sospechoso_id) REFERENCES sospechoso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- La partida termina exclusivamente con una acusación: su fecha de cierre
-- es acusacion.fecha_acusacion, por eso no se guarda una fecha_fin.
CREATE TABLE partida (
    id INTEGER PRIMARY KEY,
    caso_id INTEGER NOT NULL,
    fecha_inicio TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado TEXT NOT NULL DEFAULT 'en_curso'
        CHECK (estado IN ('en_curso', 'ganada', 'perdida')),
    FOREIGN KEY (caso_id) REFERENCES caso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE acusacion (
    id INTEGER PRIMARY KEY,
    partida_id INTEGER NOT NULL UNIQUE,
    sospechoso_id INTEGER NOT NULL,
    fecha_acusacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partida_id) REFERENCES partida(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (sospechoso_id) REFERENCES sospechoso(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Impedir relacionar evidencia con un sospechoso de otro caso.
CREATE TRIGGER trg_vinculo_caso_insert
BEFORE INSERT ON sospechoso_evidencia
BEGIN
    SELECT CASE WHEN
        (SELECT caso_id FROM sospechoso WHERE id = NEW.sospechoso_id) !=
        (SELECT ec.caso_id FROM evidencia ev
         JOIN escena ec ON ec.id = ev.escena_id
         WHERE ev.id = NEW.evidencia_id)
    THEN RAISE(ABORT, 'La evidencia y el sospechoso deben pertenecer al mismo caso') END;
END;

CREATE TRIGGER trg_vinculo_caso_update
BEFORE UPDATE OF sospechoso_id, evidencia_id ON sospechoso_evidencia
BEGIN
    SELECT CASE WHEN
        (SELECT caso_id FROM sospechoso WHERE id = NEW.sospechoso_id) !=
        (SELECT ec.caso_id FROM evidencia ev
         JOIN escena ec ON ec.id = ev.escena_id
         WHERE ev.id = NEW.evidencia_id)
    THEN RAISE(ABORT, 'La evidencia y el sospechoso deben pertenecer al mismo caso') END;
END;

-- El sospechoso acusado debe pertenecer al caso de la partida.
-- No se puede acusar si la partida terminó.
CREATE TRIGGER trg_acusacion_validar_insert
BEFORE INSERT ON acusacion
BEGIN
    SELECT CASE WHEN
        (SELECT estado FROM partida WHERE id = NEW.partida_id) != 'en_curso'
    THEN RAISE(ABORT, 'No se puede acusar en una partida terminada') END;
    SELECT CASE WHEN
        (SELECT caso_id FROM partida WHERE id = NEW.partida_id) !=
        (SELECT caso_id FROM sospechoso WHERE id = NEW.sospechoso_id)
    THEN RAISE(ABORT, 'El sospechoso no pertenece al caso de la partida') END;
END;

-- Las acusaciones quedan inmutables para preservar el historial.
CREATE TRIGGER trg_acusacion_no_update
BEFORE UPDATE ON acusacion
BEGIN
    SELECT RAISE(ABORT, 'Una acusacion registrada no puede modificarse');
END;

CREATE TRIGGER trg_acusacion_no_delete
BEFORE DELETE ON acusacion
BEGIN
    SELECT RAISE(ABORT, 'Una acusacion registrada no puede eliminarse');
END;

-- Registrar la acusación cierra la partida en la misma sentencia INSERT: el
-- resultado se calcula acá a partir de es_culpable ('ganada' si el acusado es
-- culpable, 'perdida' si es inocente). Si el cierre falla, SQLite revierte la
-- sentencia completa y no queda una acusación con la partida en curso.
-- Con un sospechoso inexistente no se actualiza nada: la clave foránea
-- rechaza la sentencia al terminar.
CREATE TRIGGER trg_acusacion_cerrar_partida
AFTER INSERT ON acusacion
WHEN EXISTS (SELECT 1 FROM sospechoso WHERE id = NEW.sospechoso_id)
BEGIN
    UPDATE partida
    SET estado = (SELECT CASE WHEN s.es_culpable = 1 THEN 'ganada' ELSE 'perdida' END
                  FROM sospechoso s
                  WHERE s.id = NEW.sospechoso_id)
    WHERE id = NEW.partida_id;
END;

-- Una partida finalizada es historial: no se reabre ni cambia ningún dato
-- (estado, fecha_inicio ni caso).
CREATE TRIGGER trg_partida_finalizada_inmutable
BEFORE UPDATE ON partida
WHEN OLD.estado != 'en_curso'
BEGIN
    SELECT RAISE(ABORT, 'Una partida finalizada no puede modificarse ni reabrirse');
END;

-- Una partida en curso solo se cierra con una acusación cuyo resultado
-- coincide con es_culpable. Las condiciones de este trigger y del anterior no
-- se superponen, así que cada rechazo tiene un único mensaje posible.
CREATE TRIGGER trg_partida_validar_cierre
BEFORE UPDATE OF estado ON partida
WHEN OLD.estado = 'en_curso' AND NEW.estado != OLD.estado
BEGIN
    SELECT CASE WHEN NEW.estado IN ('ganada', 'perdida') AND NOT EXISTS (
        SELECT 1
        FROM acusacion a JOIN sospechoso s ON s.id = a.sospechoso_id
        WHERE a.partida_id = NEW.id
          AND (CASE WHEN s.es_culpable = 1 THEN 'ganada' ELSE 'perdida' END) = NEW.estado
    ) THEN RAISE(ABORT, 'El resultado no coincide con la acusacion') END;
END;

CREATE TRIGGER trg_partida_no_insertar_finalizada
BEFORE INSERT ON partida
WHEN NEW.estado != 'en_curso'
BEGIN
    SELECT RAISE(ABORT, 'Las partidas deben comenzar en curso');
END;

-- Una vez asignado un registro a un caso, no se permite moverlo a otro.
-- Esto evita dejar relaciones cruzadas entre casos al modificar padres.
CREATE TRIGGER trg_sospechoso_caso_inmutable
BEFORE UPDATE OF caso_id ON sospechoso
WHEN NEW.caso_id <> OLD.caso_id
BEGIN
    SELECT RAISE(ABORT, 'No se puede mover un sospechoso a otro caso');
END;

CREATE TRIGGER trg_escena_caso_inmutable
BEFORE UPDATE OF caso_id ON escena
WHEN NEW.caso_id <> OLD.caso_id
BEGIN
    SELECT RAISE(ABORT, 'No se puede mover una escena a otro caso');
END;

CREATE TRIGGER trg_evidencia_escena_inmutable
BEFORE UPDATE OF escena_id ON evidencia
WHEN NEW.escena_id <> OLD.escena_id
BEGIN
    SELECT RAISE(ABORT, 'No se puede mover una evidencia a otra escena');
END;

CREATE TRIGGER trg_partida_caso_inmutable
BEFORE UPDATE OF caso_id ON partida
WHEN NEW.caso_id <> OLD.caso_id
BEGIN
    SELECT RAISE(ABORT, 'No se puede cambiar el caso de una partida');
END;

CREATE TRIGGER trg_culpabilidad_historial
BEFORE UPDATE OF es_culpable ON sospechoso
WHEN NEW.es_culpable <> OLD.es_culpable
  AND EXISTS (SELECT 1 FROM acusacion WHERE sospechoso_id = OLD.id)
BEGIN
    SELECT RAISE(ABORT, 'No se puede cambiar culpabilidad con arrestos registrados');
END;

CREATE INDEX ix_sospechoso_caso ON sospechoso(caso_id);
CREATE INDEX ix_sospechoso_lugar_coartada ON sospechoso(lugar_coartada_id);
CREATE INDEX ix_escena_caso ON escena(caso_id);
CREATE INDEX ix_escena_lugar ON escena(lugar_id);
CREATE INDEX ix_evidencia_escena ON evidencia(escena_id);
CREATE INDEX ix_evidencia_lugar_acreditado ON evidencia(lugar_acreditado_id);
CREATE INDEX ix_vinculos_evidencia ON sospechoso_evidencia(evidencia_id);
CREATE INDEX ix_interrogatorio_sospechoso ON interrogatorio(sospechoso_id);
CREATE INDEX ix_partida_caso ON partida(caso_id);
CREATE INDEX ix_acusacion_sospechoso ON acusacion(sospechoso_id);

-- ============================================================
-- 2. DML: un caso, siete lugares, cuatro sospechosos, tres escenas,
--    dieciocho pistas
-- ============================================================
INSERT INTO caso (id, titulo, descripcion, fecha_apertura, estado) VALUES
(1, 'El silencio del archivo',
 'La directora del archivo municipal fue asesinada a las 21:30. Cuatro personas mintieron sobre su ubicación. Solo una cometió el crimen.',
 '2026-11-10', 'abierto');

INSERT INTO lugar (id, nombre, tipo_lugar) VALUES
(1, 'Archivo municipal', 'oficina'),
(2, 'Estacionamiento municipal', 'estacionamiento'),
(3, 'Cafe Bahia', 'cafeteria'),
(4, 'Hospital Central', 'hospital'),
(5, 'Domicilio de Bruno', 'vivienda'),
(6, 'Restaurante Central', 'restaurante'),
(7, 'Gimnasio Norte', 'gimnasio');

INSERT INTO escena (id, caso_id, lugar_id, hora_suceso, es_principal) VALUES
(1, 1, 1, '2026-11-09 21:30:00', 1),
(2, 1, 2, '2026-11-09 21:20:00', 0),
(3, 1, 3, '2026-11-09 21:10:00', 0);

INSERT INTO sospechoso
(id, caso_id, nombre, coartada, lugar_coartada_id, coartada_desde, coartada_hasta, relacion_victima, es_culpable)
VALUES
(1, 1, 'Elisa Rivas', 'Afirmo que estuvo en el hospital toda la noche.',
 4, '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Hermana de la victima', 0),
(2, 1, 'Bruno Torres', 'Afirmo que estuvo en su casa desde las 21:00.',
 5, '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Exsocio de la victima', 0),
(3, 1, 'Carla Mendez', 'Afirmo que ceno en un restaurante entre las 21:00 y las 22:00.',
 6, '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Empleada del archivo', 1),
(4, 1, 'Diego Salas', 'Afirmo que estuvo entrenando en el gimnasio.',
 7, '2026-11-09 21:00:00', '2026-11-09 22:00:00', 'Proveedor del archivo', 0);

-- Evidencias 11 a 18: pistas falsas y exculpatorias para que la matriz no
-- revele la solución. Bruno suma en la escena principal el mismo peso
-- incriminatorio que Carla, pero su registro digital queda lejos de las 21:30
-- y una cámara lo ubica en Cafe Bahia a la hora del crimen. Elisa tiene un
-- motivo, pero una cámara la muestra en su auto a las 21:30. Carla también
-- tiene una prueba exculpatoria, aunque solo cubre su coartada hasta las 21:12.
--
-- Lugar acreditado (lugar_acreditado_id): una prueba acredita un lugar solo si
-- registra dónde ocurrió el hecho que demuestra (registros digitales, el
-- ticket) o si es un rastro sobre una parte fija de la escena (huellas en el
-- acceso o en el picaporte). Un objeto que se puede trasladar (arma, guante,
-- colilla, pagaré, testamento) no acredita dónde estuvo una persona. Lugares:
-- 1 Archivo municipal, 2 Estacionamiento municipal, 3 Cafe Bahia,
-- 6 Restaurante Central.
INSERT INTO evidencia (id, escena_id, tipo, descripcion, relevancia, hora_indicio, lugar_acreditado_id) VALUES
(1, 1, 'huella', 'Huella sobre el arma, identificable y compatible con una persona investigada.', 5, NULL, NULL),
(2, 1, 'registro_digital', 'Acceso con credencial personal registrado a las 21:29.', 5, '2026-11-09 21:29:00', 1),
(3, 1, 'ADN', 'Rastro biologico en un guante descartado junto a la victima.', 5, NULL, NULL),
(4, 1, 'objeto', 'Fragmento del identificador de acceso encontrado junto al cuerpo.', 3, NULL, NULL),
(5, 2, 'registro_digital', 'Camara del estacionamiento a las 21:19.', 4, '2026-11-09 21:19:00', 2),
(6, 2, 'registro_digital', 'Camara del estacionamiento a las 21:22.', 4, '2026-11-09 21:22:00', 2),
(7, 3, 'registro_digital', 'Pago electronico en Cafe Bahia a las 21:08.', 4, '2026-11-09 21:08:00', 3),
(8, 1, 'huella', 'Huella en el acceso del archivo correspondiente a una visita anterior.', 2, '2026-11-09 20:40:00', 1),
(9, 2, 'objeto', 'Ticket de estacionamiento sin identidad asociada.', 2, NULL, NULL),
(10, 3, 'objeto', 'Nota manuscrita abandonada en una mesa.', 1, NULL, NULL),
(11, 1, 'objeto', 'Pagare impago firmado a favor de la victima, con una amenaza escrita al dorso.', 4, NULL, NULL),
(12, 1, 'huella', 'Huella en el picaporte de la oficina de la directora.', 3, NULL, 1),
(13, 1, 'ADN', 'Colilla de cigarrillo en el cenicero de la oficina.', 3, NULL, NULL),
-- El mensaje tiene hora de recepción, pero no acredita dónde estaba quien lo envió.
(14, 1, 'registro_digital', 'Mensaje de texto amenazante en el telefono de la victima, recibido a las 20:55.', 4, '2026-11-09 20:55:00', NULL),
(15, 3, 'registro_digital', 'Camara de seguridad de Cafe Bahia que muestra a un cliente sentado en una mesa a las 21:30.', 5, '2026-11-09 21:30:00', 3),
(16, 1, 'objeto', 'Testamento de la victima que nombra a su hermana como unica heredera.', 2, NULL, NULL),
(17, 2, 'registro_digital', 'Camara del estacionamiento que muestra a una mujer todavia dentro de su auto a las 21:30.', 4, '2026-11-09 21:30:00', 2),
-- El ticket se encontró en el archivo (escena 1), pero acredita una operación
-- en Restaurante Central a las 21:12: lugar del hallazgo y lugar acreditado difieren.
(18, 1, 'objeto', 'Ticket de Restaurante Central de las 21:12 encontrado en el escritorio de una empleada.', 2, '2026-11-09 21:12:00', 6);

INSERT INTO sospechoso_evidencia
(sospechoso_id, evidencia_id, tipo_vinculo, peso, observaciones) VALUES
(3, 1, 'incrimina', 5, 'La huella corresponde a Carla y aparece en el arma.'),
(3, 2, 'incrimina', 5, 'La credencial de Carla abrio el archivo un minuto antes del crimen.'),
(3, 3, 'incrimina', 5, 'El ADN recuperado es compatible con Carla.'),
(3, 4, 'incrimina', 3, 'El identificador roto pertenece a Carla.'),
(1, 5, 'presencia', 2, 'La camara sitúa a Elisa fuera del hospital durante su coartada.'),
(4, 6, 'presencia', 2, 'La camara sitúa a Diego fuera del gimnasio durante su coartada.'),
(2, 7, 'presencia', 2, 'El pago sitúa a Bruno fuera de su domicilio durante su coartada.'),
(1, 8, 'presencia', 1, 'Elisa estuvo en el archivo antes del periodo declarado; no prueba presencia al cometerse el crimen.'),
(2, 11, 'incrimina', 5, 'Bruno firmo el pagare y escribio la amenaza: le debia dinero a la victima.'),
(2, 12, 'incrimina', 4, 'La huella del picaporte es de Bruno, aunque no permite saber cuando la dejo.'),
(2, 13, 'incrimina', 4, 'El ADN de la colilla es compatible con Bruno, que fumaba en sus reuniones con la victima.'),
(2, 14, 'incrimina', 5, 'Bruno envio el mensaje amenazante a las 20:55, media hora antes del crimen.'),
(2, 15, 'exculpa', 5, 'El cliente de la camara es Bruno: estaba en Cafe Bahia a la hora del crimen.'),
(1, 16, 'incrimina', 3, 'Elisa hereda los bienes de la victima: tiene un motivo, pero nada la ubica en la escena.'),
(1, 17, 'exculpa', 4, 'La mujer del auto es Elisa: seguia en el estacionamiento a la hora del crimen.'),
(3, 18, 'exculpa', 2, 'El ticket es de Carla y respalda su coartada, pero solo hasta las 21:12.');

INSERT INTO interrogatorio
(id, sospechoso_id, fecha_hora, declaracion, contradiccion_detectada) VALUES
(1, 1, '2026-11-10 10:00:00', 'No abandone el hospital entre las 21:00 y las 22:00.',
 'Una camara registra a Elisa en el estacionamiento a las 21:19.'),
(2, 2, '2026-11-10 10:20:00', 'No sali de mi casa despues de las 21:00.',
 'Una compra confirmada la ubica en Cafe Bahia a las 21:08.'),
(3, 3, '2026-11-10 10:40:00', 'No entre al archivo esa noche.',
 'Su credencial abre el archivo a las 21:29 y se hallan pruebas materiales.'),
(4, 4, '2026-11-10 11:00:00', 'Me quede en el gimnasio hasta las 22:00.',
 'Una camara registra a Diego en el estacionamiento a las 21:22.'),
(5, 2, '2026-11-11 09:30:00', 'Admito que menti: estuve en Cafe Bahia desde las 21:05 hasta pasadas las 21:30.',
 NULL);

-- ============================================================
-- 3. Diez consultas académicas (todas ejecutables)
-- ============================================================

-- C1: Descartar coartadas por el lugar que acredita cada evidencia dentro del horario declarado.
-- JOIN de sospechoso -> sospechoso_evidencia -> evidencia -> lugar (acreditado)
-- y sospechoso -> lugar (declarado). El lugar observado es el lugar acreditado
-- por la evidencia, no el de la escena donde se encontró: una evidencia sin
-- lugar acreditado o sin hora no contradice ninguna coartada.
SELECT DISTINCT s.id, s.nombre,
       lugar_declarado.nombre AS lugar_declarado,
       lugar_observado.nombre AS lugar_observado,
       ev.hora_indicio
FROM sospechoso s
JOIN lugar lugar_declarado ON lugar_declarado.id = s.lugar_coartada_id
JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
JOIN evidencia ev ON ev.id = se.evidencia_id
JOIN lugar lugar_observado ON lugar_observado.id = ev.lugar_acreditado_id
WHERE ev.hora_indicio IS NOT NULL
  AND ev.hora_indicio BETWEEN s.coartada_desde AND s.coartada_hasta
  AND ev.lugar_acreditado_id <> s.lugar_coartada_id
ORDER BY s.id, ev.hora_indicio;

-- C2: Matriz de evidencias por sospechoso, con pesos incriminatorios y exculpatorios por separado.
SELECT s.id, s.nombre,
       COUNT(CASE WHEN se.tipo_vinculo = 'incrimina' THEN 1 END) AS cantidad_incriminatorias,
       COALESCE(SUM(CASE WHEN se.tipo_vinculo = 'incrimina' THEN se.peso END), 0) AS peso_incriminatorio,
       COUNT(CASE WHEN se.tipo_vinculo = 'presencia' THEN 1 END) AS cantidad_presencias,
       COALESCE(SUM(CASE WHEN se.tipo_vinculo = 'exculpa' THEN se.peso END), 0) AS peso_exculpatorio
FROM sospechoso s
LEFT JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
GROUP BY s.id, s.nombre
ORDER BY s.id;

-- C3: Veredicto deducido por pruebas independientes en escena principal.
-- No consulta la marca de culpabilidad: requiere huella/ADN/objeto y registro
-- digital incriminatorios, peso >= 8, acceso digital próximo al horario del
-- crimen y ninguna prueba exculpatoria que acredite otro lugar con hora a 600
-- segundos o menos del crimen (una exculpatoria sin lugar o sin hora no
-- alcanza para descartar). Las diferencias de tiempo se calculan en segundos
-- enteros con strftime('%s'): diez minutos son exactamente 600 segundos.
SELECT s.id, s.nombre
FROM sospechoso s
JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
JOIN evidencia ev ON ev.id = se.evidencia_id
JOIN escena ec ON ec.id = ev.escena_id
WHERE se.tipo_vinculo = 'incrimina' AND ec.es_principal = 1
  AND NOT EXISTS (
      SELECT 1
      FROM sospechoso_evidencia exculpatoria
      JOIN evidencia ev_exculpatoria ON ev_exculpatoria.id = exculpatoria.evidencia_id
      WHERE exculpatoria.sospechoso_id = s.id
        AND exculpatoria.tipo_vinculo = 'exculpa'
        AND ev_exculpatoria.lugar_acreditado_id IS NOT NULL
        AND ev_exculpatoria.lugar_acreditado_id <> ec.lugar_id
        AND ev_exculpatoria.hora_indicio IS NOT NULL
        AND ABS(CAST(strftime('%s', ev_exculpatoria.hora_indicio) AS INTEGER)
              - CAST(strftime('%s', ec.hora_suceso) AS INTEGER)) <= 600)
GROUP BY s.id, s.nombre
HAVING COUNT(DISTINCT ev.tipo) >= 2
   AND SUM(se.peso) >= 8
   AND MAX(CASE WHEN ev.tipo = 'registro_digital'
     AND ev.hora_indicio IS NOT NULL
     AND ABS(CAST(strftime('%s', ev.hora_indicio) AS INTEGER)
           - CAST(strftime('%s', ec.hora_suceso) AS INTEGER)) <= 600
     THEN 1 ELSE 0 END) = 1;

-- C4: Todas las evidencias, con el lugar de su escena y su tipo de lugar.
SELECT ev.id, ev.tipo, ev.descripcion, l.nombre AS lugar, l.tipo_lugar
FROM evidencia ev
JOIN escena ec ON ec.id = ev.escena_id
JOIN lugar l ON l.id = ec.lugar_id
ORDER BY ec.id, ev.id;

-- C5: Anti-join: evidencias sin sospechosos vinculados.
SELECT ev.id, ev.descripcion
FROM evidencia ev
LEFT JOIN sospechoso_evidencia se ON se.evidencia_id = ev.id
WHERE se.sospechoso_id IS NULL;

-- C6: Subconsulta escalar: relevancia superior al promedio.
SELECT id, tipo, descripcion, relevancia FROM evidencia
WHERE relevancia > (SELECT AVG(relevancia) FROM evidencia);

-- C7: GROUP BY + HAVING: sospechosos con al menos dos indicios incriminatorios.
SELECT s.nombre, COUNT(*) AS total_incriminatorios
FROM sospechoso s
JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
WHERE se.tipo_vinculo = 'incrimina'
GROUP BY s.id, s.nombre
HAVING COUNT(*) >= 2;

-- C8: Interrogatorios con contradiccion registrada.
SELECT s.nombre, i.declaracion, i.contradiccion_detectada
FROM interrogatorio i
JOIN sospechoso s ON s.id = i.sospechoso_id
WHERE i.contradiccion_detectada IS NOT NULL
  AND TRIM(i.contradiccion_detectada) <> '';

-- C9: Recuento de pistas por escena, con el nombre de su lugar.
SELECT ec.id AS escena_id, l.nombre AS lugar, COUNT(ev.id) AS total_pistas
FROM escena ec
JOIN lugar l ON l.id = ec.lugar_id
LEFT JOIN evidencia ev ON ev.escena_id = ec.id
GROUP BY ec.id, l.nombre
ORDER BY ec.id;

-- C10: Ranking de sospechosos por peso incriminatorio, con desempate por nombre.
SELECT s.nombre,
       COALESCE(SUM(CASE WHEN se.tipo_vinculo = 'incrimina' THEN se.peso END), 0) AS peso_incriminatorio
FROM sospechoso s
LEFT JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
GROUP BY s.id, s.nombre
ORDER BY peso_incriminatorio DESC, s.nombre;

-- ============================================================
-- 4. Transacciones ejecutables: COMMIT y ROLLBACK
-- ============================================================
-- Ambas demostraciones usan la acción central del juego: abrir una partida y
-- registrar el arresto. El cierre de la partida no es una sentencia aparte:
-- el trigger trg_acusacion_cerrar_partida lo hace dentro del mismo INSERT de
-- la acusación, así que acusación y cierre nunca quedan separados.
-- La transacción explícita agrupa las dos sentencias (crear la partida y
-- acusar): o se confirman juntas con COMMIT, o se descartan juntas con
-- ROLLBACK, sin dejar una partida abierta de un intento fallido.
-- Ninguna demostración modifica el caso ni los datos de la investigación,
-- por lo que la base queda lista para jugar.

-- 4.1 COMMIT: el jugador arresta a un inocente (Diego Salas) y pierde.
-- No hay UPDATE: SQLite calcula 'perdida' a partir de es_culpable del acusado.
BEGIN TRANSACTION;
INSERT INTO partida (id, caso_id) VALUES (1, 1);
INSERT INTO acusacion (partida_id, sospechoso_id) VALUES (1, 4);
-- Antes del COMMIT la partida ya figura cerrada por el trigger.
SELECT id AS partida_id, estado AS estado_antes_del_commit FROM partida WHERE id = 1;
COMMIT;

-- Resultado confirmado: la partida 1 quedó perdida y el caso sigue abierto.
SELECT p.id AS partida_id, p.estado AS estado_partida, s.nombre AS acusado,
       a.fecha_acusacion AS fecha_cierre, c.estado AS estado_caso
FROM partida p
JOIN acusacion a ON a.partida_id = p.id
JOIN sospechoso s ON s.id = a.sospechoso_id
JOIN caso c ON c.id = p.caso_id
WHERE p.id = 1;

-- 4.2 ROLLBACK: se abre una partida y se registra un arresto (el trigger la
-- cierra como 'perdida'), pero la operación se descarta antes de confirmarla:
-- el ROLLBACK revierte la partida, la acusación y el cierre automático.
-- Dentro del script no se provoca un error real: con sqlite3 -bail o desde
-- db:init, el primer error detiene la ejecución y la base quedaría a medio
-- crear. En la aplicación, cuando SQLite devuelve un error (por ejemplo, un
-- trigger que rechaza la acusación), el backend ejecuta este mismo ROLLBACK.
BEGIN TRANSACTION;
INSERT INTO partida (id, caso_id) VALUES (2, 1);
INSERT INTO acusacion (partida_id, sospechoso_id) VALUES (2, 1);
ROLLBACK;

-- Verificación: no quedó ninguna fila de la partida descartada.
SELECT COUNT(*) AS partidas_descartadas FROM partida WHERE id = 2;
SELECT COUNT(*) AS acusaciones_descartadas FROM acusacion WHERE partida_id = 2;

-- ============================================================
-- 5. Vista para alimentar /api/casos/:id/investigacion/matriz
-- ============================================================
-- No expone la culpabilidad: solo los conteos y pesos de la matriz.
CREATE VIEW vista_matriz_evidencias AS
SELECT s.id AS sospechoso_id,
       s.caso_id,
       s.nombre,
       COUNT(CASE WHEN se.tipo_vinculo = 'incrimina' THEN 1 END) AS cantidad_incriminatorias,
       COALESCE(SUM(CASE WHEN se.tipo_vinculo = 'incrimina' THEN se.peso END), 0) AS peso_incriminatorio,
       COUNT(CASE WHEN se.tipo_vinculo = 'presencia' THEN 1 END) AS cantidad_presencias,
       COALESCE(SUM(CASE WHEN se.tipo_vinculo = 'exculpa' THEN se.peso END), 0) AS peso_exculpatorio
FROM sospechoso s
LEFT JOIN sospechoso_evidencia se ON se.sospechoso_id = s.id
GROUP BY s.id, s.caso_id, s.nombre;
