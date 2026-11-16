# Bitácora de uso de IA

Registro de los pedidos importantes hechos a herramientas de IA, las respuestas obtenidas y lo que el equipo aceptó, corrigió o rechazó. Formato y límites por fase: ver `Skills/bitacora-ia/SKILL.md`.

### 2026-11-14 — Estructura inicial del repositorio

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** crear el primer commit con la estructura de carpetas propuesta, las ramas `main` y `dev`, y un PR con la estructura.
- **Respuesta:** commit inicial en `main`, rama `dev` y PR #1 desde `chore/project-structure` con las carpetas `frontend/`, `backend/`, `database/` y `docs/`, un `package.json` mínimo y el README.
- **Decisión:** corregido. El README y el PR se habían generado en inglés; se pidió que estén en español.

### 2026-11-14 — Configuración de agentes y skills

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** configurar skills compatibles con los agentes de IA siguiendo la estructura de `NachoBasilio/set-up-ia-projects`: `CLAUDE.md` que apunte a `AGENTS.md`, skills que indiquen que los PR se escriben en español, y participantes en el README. Todo dentro del PR #1.
- **Respuesta:** `AGENTS.md` con reglas derivadas de la consigna, `CLAUDE.md` que lo importa con `@AGENTS.md`, skills `git-workflow`, `sqlite-schema`, `express-api`, `bitacora-ia`, `skill-creator` y `skill-sync`, validador adaptado (`npm run validate:skills`) con workflow de GitHub Actions, y esta bitácora.
- **Decisión:** aceptado. El equipo revisó y mergeó los PR #1 y #2; en el #2 se pidió que el README, el PR y las skills estuvieran en español.

### 2026-11-15 — Skill de UI/UX

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** crear una skill de UI/UX basada en UI UX Pro Max (https://uupm.cc/), con la misma estructura que las skills del proyecto.
- **Respuesta:** skill `Skills/ui-ux/SKILL.md` con las prioridades y el checklist de UI UX Pro Max adaptados a HTML, CSS y JavaScript sin frameworks, más reglas propias del juego (culpable oculto en la UI, errores de la API sin duplicar validaciones). No se instaló el buscador ni la base de datos de UI UX Pro Max. Fila nueva en la tabla de `AGENTS.md`.
- **Decisión:** aceptado y mergeado en el PR #3.

### 2026-11-15 — Skill de UI/UX: enfoque de Impeccable

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** que la skill de UI/UX también se parezca a lo que propone Impeccable (https://impeccable.style/).
- **Respuesta:** se sumaron a `Skills/ui-ux/SKILL.md` el contexto de diseño antes de construir (`docs/design.md`), el modo de cada pantalla del juego, el vocabulario de pedidos (`critique`, `audit`, `polish`, etc.), el piso de calidad y los anti-patrones de interfaces genéricas. No se instaló el CLI ni el detector de Impeccable.
- **Decisión:** aceptado y mergeado en el PR #3.

### 2026-11-15 — Revisión del diseño del equipo y cierre del esquema SQL

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Modelo relacional y SQL.
- **Pedido:** revisar contra la consigna oficial el diseño de 8 tablas del equipo y su script, y después aplicar las decisiones que tomó el equipo: tabla `lugar`, quitar `partida.fecha_fin`, dejar ejecutables el `COMMIT` y el `ROLLBACK`, agregar evidencias para que la matriz no revele la solución, dibujar el MER completo del modelo y escribir los tests de base de datos.
- **Respuesta:** la revisión ejecutó el script y señaló que las transacciones estaban comentadas, que la matriz delataba a la culpable (18 contra 0) y que `escena` tenía la dependencia transitiva `ubicacion → tipo_lugar`. A partir del diseño de ocho tablas y del script SQL original del equipo, la IA revisó, adaptó y completó la implementación, incorporando las modificaciones acordadas. Resultado: `database/detective.sql` (9 tablas), `npm run db:init` y `npm run db:reset`, 50 tests con `node:test` y `docs/modelo-datos.md`, donde la IA dibujó en Mermaid el modelo definido por el equipo (entidades, atributos, claves y cardinalidades) para pasarlo a Miro. Una verificación independiente encontró que Elisa quedaba incriminada sin prueba exculpatoria y que la matriz seguía señalando a la culpable en un paso; se corrigió con dos evidencias nuevas y una condición de horario en el veredicto.
- **Decisión:** el diseño de la base es del equipo: la IA lo revisó y lo implementó. El equipo eligió la tabla `lugar` frente a las alternativas que propuso la revisión (agregar `UNIQUE` o dejarlo igual) y decidió quitar `partida.fecha_fin`. Revisado y mergeado en el PR #5. El equipo dibuja el MER en Miro a partir del diagrama.

### 2026-11-15 — API REST y frontend del juego

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Aplicación.
- **Pedido:** mergear el esquema cerrado y desarrollar la aplicación sobre él: API REST con Express (incluida la transacción de arresto), tests de API con Supertest y las cuatro pantallas del juego.
- **Respuesta:** antes de programar se fijó el contrato JSON de cada endpoint. La IA generó el backend (`backend/`), 38 tests de API y el frontend (`frontend/`, con el sistema visual en `docs/design.md`). El culpable solo se devuelve en la respuesta del arresto; `GET /api/partidas/:id` no muestra ni el acusado ni el culpable. Una verificación independiente de la API no encontró bloqueantes (formatos, códigos, secreto del culpable, `ROLLBACK` e inyección SQL). El recorrido del frontend en un navegador sin interfaz encontró tres errores de presentación, que se corrigieron.
- **Decisión:** aceptado y mergeado en el PR #6. La aplicación no modifica el esquema ni repite las reglas de la base: ejecuta el SQL y traduce los errores de SQLite a códigos HTTP.

### 2026-11-15 — README e informe técnico

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Documentación.
- **Pedido:** escribir el README de instalación y la documentación técnica base para el informe final, con las quince secciones que pide la consigna.
- **Respuesta:** `README.md` con requisitos, instalación desde cero, `db:init`, `npm start`, tests, URLs de la API, arquitectura, cómo jugar y cómo verificar la transacción y el `ROLLBACK`. `docs/README-documentacion.md` con las quince secciones, el diccionario de datos completo y la explicación de las diez consultas con resultados reales. Todos los comandos y resultados se ejecutaron antes de documentarlos. Lo que solo puede aportar el equipo quedó marcado como "Para completar por el equipo".
- **Decisión:** aceptado. En la revisión del PR #7, un integrante pidió agregar los comandos de PowerShell y registrar la prueba en Windows (Node.js 22.14.0, 147 de 147 tests), y se incorporó. Llega a `dev` con el PR #10. El equipo completa las capturas de Miro y de la aplicación, el documento del equipo y la revisión final del MER.

### 2026-11-15 — Correcciones de la auditoría final (PR #6)

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** SQL y aplicación.
- **Pedido:** pedir una auditoría del modelo asistida por IA antes de la entrega y corregir sus hallazgos en el PR #6: precisión temporal del veredicto (H1), separar el lugar donde se encontró una prueba del lugar que acredita (H2), cerrar la partida desde SQLite al registrar la acusación (H3) y revisar garantías adicionales (H4).
- **Respuesta:** hallazgos de la auditoría: H1, C3 calculaba las diferencias de horario con `julianday()` y una diferencia de exactamente diez minutos (600 segundos) quedaba afuera; H2, la base confundía el lugar donde se encontró una prueba con el lugar que esa prueba acredita, y el ticket de Carla tenía la hora en `NULL` para no producir falsos positivos; H3, ejecutando SQL directo se podía registrar una acusación y confirmar la transacción sin cerrar la partida; H4, el índice único garantizaba como máximo un culpable pero no exactamente uno, la fecha de inicio de una partida terminada se podía modificar y C3 podía dejar de coincidir con `es_culpable` si se editaban las evidencias. Correcciones: C3 compara horarios en segundos enteros con `strftime('%s')` (diez minutos son 600 segundos exactos; `julianday()` excluía el límite). Nueva columna `evidencia.lugar_acreditado_id` (clave foránea a `lugar`); C1 y C3 usan el lugar acreditado y el ticket de Carla guarda su hora real (21:12). Trigger `trg_acusacion_cerrar_partida`: insertar la acusación cierra la partida como ganada o perdida según `es_culpable`, y el backend solo lee el estado guardado. Trigger `trg_partida_finalizada_inmutable` y validación de exactamente un culpable por caso al inicializar. Se agregó el campo `lugarAcreditado` a las evidencias de la API y una columna en la tabla de evidencias. Antes de implementar, 48 de 142 tests fallaban por los defectos reportados; después, 142 de 142.
- **Decisión:** aceptado y mergeado en el PR #6. H1, H2 y H3 se corrigieron por completo. De H4 se aplicaron protecciones simples (partidas terminadas inmutables y validación de exactamente un culpable al inicializar) y se documentó que SQLite no mantiene sincronizados C3 y `es_culpable` si se editan las evidencias a mano, y que el índice único garantiza como máximo un culpable mientras la inicialización garantiza exactamente uno.

### 2026-11-15 — Observaciones del juicio independiente (PR #6)

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** SQL.
- **Pedido:** pedir un juicio independiente asistido por IA del commit con las correcciones de auditoría y aplicar en el PR #6 sus observaciones no bloqueantes.
- **Respuesta:** el juicio, con dos revisiones independientes del mismo commit y pruebas adversariales, no encontró defectos bloqueantes: reprodujo los límites de ±600 segundos, el cierre automático de la partida, una falla inyectada que no dejó datos parciales y el rechazo a modificar una partida terminada; `integrity_check` dio `ok` y pasaron 142 de 142 tests. Dejó tres observaciones no bloqueantes, que se aplicaron. I1: en C3, el registro digital incriminatorio que corrobora la presencia ahora tiene que acreditar el lugar de la escena principal, no solo haberse encontrado en ella. I2: `crearBase` borra el archivo de una creación rechazada solo si lo creó esa misma llamada; nunca borra una base existente. I3: se documentó la política efectiva de `ON UPDATE CASCADE`, que los triggers de inmutabilidad pueden rechazar. Antes de implementar, 3 tests nuevos fallaban; después, 147 de 147.
- **Decisión:** aceptado y mergeado en el PR #6. El equipo decidió aplicar las tres observaciones, que el juicio había clasificado como mejoras opcionales. Con los datos semilla, C3 sigue devolviendo solo a Carla.

### 2026-11-15 — Resultado del arresto después de recargar (PR #6)

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Aplicación.
- **Pedido:** un integrante del equipo observó en el PR #6 que, al recargar la página después de un arresto, se perdía la pantalla de resultado, y propuso guardar la respuesta del arresto en `sessionStorage`.
- **Respuesta:** el frontend guarda la respuesta del arresto en la sesión del navegador y, al recargar, restaura el resultado solo si corresponde a la partida guardada y su estado coincide con el que devuelve la API. Un resultado guardado que no coincide se descarta, e iniciar una partida nueva borra el anterior. `GET /api/partidas/:id` sigue sin devolver acusado ni culpable.
- **Decisión:** aceptada la propuesta del equipo. Se descartó agregar un endpoint de resultado porque permitiría leer el culpable desde la partida de demostración sin jugar. Verificado en el navegador: perder y ganar, recargar, resultado alterado y partida nueva. Mergeado en el PR #6.

### 2026-11-15 — Documentación en dev y repaso de la bitácora

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Documentación.
- **Pedido:** llevar a `dev` el README y el informe, y revisar que la bitácora reflejara con exactitud el uso de IA.
- **Respuesta:** el PR #7 se había mergeado contra `feat/aplicacion` y su contenido no llegó a `dev`. El PR #10 integra en `dev` el README y el informe técnico del PR #7, y actualiza la bitácora para reflejar las decisiones y correcciones realizadas. En la bitácora se reemplazaron las decisiones que figuraban como pendientes por lo que realmente se mergeó y se precisó que la IA dibujó en Mermaid el modelo definido por el equipo.
- **Decisión:** aceptado. El equipo no oculta el uso de IA: el diseño de la base es del equipo, y la IA revisó, implementó y documentó sus decisiones.

### 2026-11-15 — Consolidación del design system (Issue #9)

- **Integrante:** Laureano Iglesias.
- **Fase:** Aplicación.
- **Pedido:** ordenar el sistema visual de la plataforma para reutilizar colores, medidas y componentes sin rediseñar la interfaz.
- **Respuesta:** se documentaron los grupos de tokens y el catálogo de componentes en `docs/design.md`; se reemplazaron medidas repetidas de controles, bordes, tablas, confirmación y sellos por tokens en `frontend/css/estilos.css`; se agregaron pruebas que detectan valores compartidos fuera de `:root`.
- **Decisión:** aceptado para revisión. Se conserva la identidad visual actual y se verificó en navegador que no haya desborde horizontal a 320, 768 y 1280 px.

### 2026-11-15 — Instalación en Windows sin compilar better-sqlite3

- **Integrante:** Lucas Gabriel Ruiz.
- **Fase:** Aplicación.
- **Pedido:** explicar por qué `npm install` fallaba en Windows con `Could not find any Python installation to use` y dejar una solución para todo el equipo.
- **Respuesta:** `better-sqlite3` 13.2.0 trae binarios precompilados y declara `"gypfile": false`, pero `package-lock.json` no guarda ese campo y npm 10 ejecuta igual `node-gyp rebuild` al instalar desde el lock. La IA lo reprodujo en un proyecto vacío: sin lock la instalación funciona y con lock falla con el mismo error. Propuso un `.npmrc` con `ignore-scripts=true`, ya que ninguna dependencia necesita scripts de instalación, y una nota en el README. npm agrega `"hasInstallScript": true` al lock en cada instalación, así que ese cambio se incluye para que el lock no quede modificado.
- **Decisión:** aceptado. Se descartó instalar Python y Visual Studio Build Tools porque solo servirían para compilar binarios que el paquete ya trae. Verificado en Windows con Node.js 22.22.3: `npm install` sin opciones instala las dependencias y `npm test` aprueba 149 de 149 tests. Riesgo aceptado: si en el futuro se agrega una dependencia que necesite su script de instalación, va a haber que revisar esta configuración.
