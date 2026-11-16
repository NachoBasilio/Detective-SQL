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
- **Respuesta:** la revisión ejecutó el script y señaló que las transacciones estaban comentadas, que la matriz delataba a la culpable (18 contra 0) y que `escena` tenía la dependencia transitiva `ubicacion → tipo_lugar`. A partir del diseño de ocho tablas y del script SQL original del equipo, la IA revisó, adaptó y completó la implementación, incorporando las modificaciones acordadas. Resultado: `database/detective.sql` (9 tablas), `npm run db:init` y `npm run db:reset`, 50 tests con `node:test` y `docs/modelo-datos.md`, donde la IA dibujó en Mermaid el modelo definido por el equipo (entidades, atributos, claves y cardinalidades). Una verificación independiente encontró que Elisa quedaba incriminada sin prueba exculpatoria y que la matriz seguía señalando a la culpable en un paso; se corrigió con dos evidencias nuevas y una condición de horario en el veredicto.
- **Decisión:** el diseño de la base es del equipo: la IA lo revisó y lo implementó. El equipo eligió la tabla `lugar` frente a las alternativas que propuso la revisión (agregar `UNIQUE` o dejarlo igual) y decidió quitar `partida.fecha_fin`. Revisado y mergeado en el PR #5.

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
- **Decisión:** aceptado. En la revisión del PR #7, un integrante pidió agregar los comandos de PowerShell y registrar la prueba en Windows (Node.js 22.14.0, 147 de 147 tests), y se incorporó. Llega a `dev` con el PR #10. El equipo completa las capturas de la aplicación, el documento del equipo y la revisión final del MER.

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

### 2026-11-15 — Partidas en curso, idiomas, tema oscuro, diálogo de arresto e ícono

- **Integrante:** Lucas Gabriel Ruiz.
- **Fase:** Aplicación.
- **Pedido:** cinco mejoras de la interfaz: retomar partidas sin terminar; deslizar el contenido al cambiar de pestaña en la investigación, con gesto táctil; traducir la interfaz al inglés y ofrecer un tema oscuro; confirmar el arresto en un diálogo modal; y reemplazar la lupa de la cabecera por un ícono de detective.
- **Respuesta:** se agregó `GET /api/partidas` con filtros opcionales `estado` y `casoId` (parámetros de SQL, sin revalidar el `CHECK` en JavaScript), que devuelve solo `id`, `casoId`, `estado` y `fechaInicio`, de la más reciente a la más antigua; el expediente lista las partidas en curso del caso, marca la actual con texto y permite retomarlas después de confirmar con `GET /api/partidas/:id` que siguen en curso. Las pestañas de la investigación deslizan el panel según su orden (300 ms, solo `transform` y `opacity`) y aceptan el gesto horizontal con Pointer Events, sin bloquear el desplazamiento vertical, el zoom ni el desplazamiento de las tablas; con `prefers-reduced-motion` el cambio es instantáneo. La interfaz tiene catálogos en español e inglés con las mismas claves, traducción de los valores fijos, de los textos de la semilla y de los errores de la API, y fechas según el idioma; el selector ES / EN y el botón de tema guardan la elección en `localStorage`. El tema oscuro redefine los mismos tokens con contrastes verificados en un test. La confirmación del arresto es un `<dialog>` modal que no se cierra con un clic afuera ni mientras se envía la orden. El ícono es un SVG propio de detective, también usado como favicon. Se agregaron 17 tests (166 en total, todos aprobados).
- **Decisión:** aceptado. Se revisaron dos decisiones de `docs/design.md`, con su motivo: se revierte la confirmación en línea, que pasa a un diálogo modal porque emitir la orden es la única acción irreversible del juego; y se mantiene el modo claro como predeterminado por la proyección en el aula, con un tema oscuro opcional que no sigue la preferencia del sistema. Solo se listan las partidas en curso: mostrar el resultado de las terminadas obligaría a la API a revelar el culpable por GET. La base y la API siguen en español; el frontend traduce lo que muestra. Verificado en Chrome sin interfaz gráfica a 320, 768 y 1280 px, en los dos temas e idiomas, con gestos táctiles emulados; queda pendiente probar el gesto en un dispositivo táctil real. Corrección posterior: al probarlo, el integrante no veía la animación de las pestañas. La medición cuadro a cuadro mostró que sí se ejecutaba, pero con la curva de los botones (240 ms) el panel recorría casi todo el trayecto mientras todavía era transparente. Se pasó a 300 ms con una curva `ease-out` propia (`--curva-pestana`) y sin desvanecer el panel que entra. Después, a pedido del integrante, el mismo deslizamiento se extendió al cambio entre las cuatro pantallas principales, según su orden y también con los botones del navegador, con un módulo compartido (`js/deslizamiento.js`); el sello del veredicto sigue siendo la única animación protagonista y la excepción a la skill `ui-ux` quedó registrada en `docs/design.md`.

### 2026-11-16 — Informe final de la entrega

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Documentación.
- **Pedido:** armar el PDF del informe final con la lista de la consigna (portada y equipo, fases 1 a 4, proceso de trabajo y uso de IA, y revisión final) y actualizarlo con las mejoras del PR #13, sin nombre de equipo, sin detallar computadoras ni conexión y sin capturas de Miro.
- **Respuesta:** el informe se genera con un script (fuera del repositorio) a partir de los documentos del repositorio y de una base nueva, sin copiar resultados a mano: ejecuta las diez consultas de `database/detective.sql`, las demostraciones de `COMMIT` y `ROLLBACK`, una transacción fallida y ocho intentos de violar reglas (SQLite rechazó los ocho); corre los 166 tests (todos aprobados); compara las columnas del script con el MER y el diccionario (coinciden las 9 tablas); y toma 11 capturas con un navegador. Al armarlo encontró que la justificación de 2FN de `docs/README-documentacion.md` decía que "la misma evidencia incrimina a uno y exculpa a otro", pero en los datos semilla ninguna evidencia está vinculada a más de un sospechoso.
- **Decisión:** aceptado. Se corrigió la justificación de 2FN: el modelo permite que una misma evidencia incrimine a un sospechoso y exculpe a otro, y en los datos Carla tiene vínculos que la incriminan y uno que la exculpa. Se quitaron los pendientes y las menciones que pedían pasar el MER a Miro; el MER versionado con el código queda como diagrama Mermaid en `docs/modelo-datos.md` (los diagramas del equipo en Miro se agregaron después: ver la entrada siguiente). Se completó el documento del equipo: Scrum pide dos roles, así que Laureano Damián Iglesias figura como desarrollador, y los tres integrantes plantearon juntos la base de datos y la idea del proyecto web, y los tres desarrollaron. Correcciones posteriores pedidas por el equipo: ordenar por número la tabla de reglas impuestas por la base, que salía 7, 8, 9, 10, 1, 2 y 4; rehacer las capturas con las mejoras del PR #13; y nombrar `main` como rama principal, con el enlace al repositorio y el flujo Gitflow. Verificado: el PDF abre, tiene 57 páginas y todas las entradas del índice tienen número de página.

### 2026-11-16 — Miro, equipo y ajustes del informe final

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Documentación.
- **Pedido:** completar el informe final con el nombre del equipo, el tablero de Miro del equipo, el motivo de la elección del juego y lo que aportó cada integrante; corregir la justificación de tecnologías, que atribuía a la consigna la elección de Express y de JavaScript sin frameworks; evitar que los bloques de código del PDF partan las líneas; y hacer más legible el MER.
- **Respuesta:** se tomaron capturas del [tablero de Miro](https://miro.com/app/board/uXjVENHpp00=/?share_link_id=636617532777) desde el enlace de solo lectura, con los cursores de otros usuarios ocultos: una vista general y una por diagrama (las tres versiones del MER, la transacción de la orden de arresto y la arquitectura). En el PDF, cada bloque de código reduce su letra hasta que entra su línea más larga, sin cortar ninguna. Para el MER del informe se probaron órdenes distintos de las relaciones, sin cambiar la definición, y se eligió el que deja una sola línea cruzada y ninguna etiqueta superpuesta.
- **Decisión:** aceptado. Se corrigió la entrada anterior, que decía que el equipo había decidido no usar Miro: el equipo tiene sus diagramas en Miro, escritos en Mermaid, y el repositorio guarda el MER en Mermaid en `docs/modelo-datos.md`. La justificación de tecnologías ahora presenta SQLite, Express y el frontend sin frameworks como elecciones del equipo, con su motivo. Se agregaron el nombre del equipo, Los Alkymeters; el motivo de la elección del juego (durante la semana, el CTO del equipo propuso jugar a algo por el estilo en un ice breaker); y lo que aportó cada integrante además del trabajo común: Ignacio, skills de IA; Lucas, mejoras en el front; Laureano, mejoras en la tokenización de los componentes web. Corrección posterior: a pedido del integrante, todos los diagramas del informe (MER final, versiones del MER, transacción de la orden de arresto y arquitectura) pasaron a ser capturas del tablero de Miro, y el MER reordenado en Mermaid dejó de usarse. Se comprobó que el código Mermaid del MER final en Miro es idéntico al de `docs/modelo-datos.md`, salvo la línea de estilo que define el color. Ajuste posterior, para que el informe se lea impreso: cada MER (final, versión 1 y versión 2) ocupa dos páginas horizontales, con la parte superior y la inferior del diagrama, porque entero en una hoja A4 su texto quedaba en unos 5 pt; y en C3 y en `registrarArresto` las líneas largas se partieron a mano en lugar de achicar la letra del bloque. Último ajuste: la hora de ejecución de los tests se informa en hora de Argentina, porque el equipo que generó el informe tiene el reloj en UTC y la mostraba tres horas adelantada; y la tabla de limitaciones (sección 6.7) se compactó, con el mismo tamaño de letra, para que las mejoras futuras no queden solas en una página casi vacía.
