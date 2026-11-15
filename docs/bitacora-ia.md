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
- **Pedido:** configurar skills compatibles con Claude siguiendo la estructura de `NachoBasilio/set-up-ia-projects`: `CLAUDE.md` que apunte a `AGENTS.md`, skills que indiquen que los PR se escriben en español, y participantes en el README. Todo dentro del PR #1.
- **Respuesta:** `AGENTS.md` con reglas derivadas de la consigna, `CLAUDE.md` que lo importa con `@AGENTS.md`, skills `git-workflow`, `sqlite-schema`, `express-api`, `bitacora-ia`, `skill-creator` y `skill-sync`, validador adaptado (`npm run validate:skills`) con workflow de GitHub Actions, y esta bitácora.
- **Decisión:** pendiente de revisión del equipo en el PR #1.

### 2026-11-15 — Skill de UI/UX

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** crear una skill de UI/UX basada en UI UX Pro Max (https://uupm.cc/), con la misma estructura que las skills del proyecto.
- **Respuesta:** skill `Skills/ui-ux/SKILL.md` con las prioridades y el checklist de UI UX Pro Max adaptados a HTML, CSS y JavaScript sin frameworks, más reglas propias del juego (culpable oculto en la UI, errores de la API sin duplicar validaciones). No se instaló el buscador ni la base de datos de UI UX Pro Max. Fila nueva en la tabla de `AGENTS.md`.
- **Decisión:** pendiente de revisión del equipo en el PR.

### 2026-11-15 — Skill de UI/UX: enfoque de Impeccable

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Organización.
- **Pedido:** que la skill de UI/UX también se parezca a lo que propone Impeccable (https://impeccable.style/).
- **Respuesta:** se sumaron a `Skills/ui-ux/SKILL.md` el contexto de diseño antes de construir (`docs/design.md`), el modo de cada pantalla del juego, el vocabulario de pedidos (`critique`, `audit`, `polish`, etc.), el piso de calidad y los anti-patrones de interfaces genéricas. No se instaló el CLI ni el detector de Impeccable.
- **Decisión:** pendiente de revisión del equipo en el PR.

### 2026-11-15 — Revisión del diseño del equipo y cierre del esquema SQL

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** Modelo relacional y SQL.
- **Pedido:** revisar contra la consigna oficial el diseño de 8 tablas del equipo y su script, y después aplicar las decisiones que tomó el equipo: tabla `lugar`, quitar `partida.fecha_fin`, dejar ejecutables el `COMMIT` y el `ROLLBACK`, agregar evidencias para que la matriz no revele la solución, generar el MER completo y escribir los tests de base de datos.
- **Respuesta:** la revisión ejecutó el script y señaló que las transacciones estaban comentadas, que la matriz delataba a la culpable (18 contra 0) y que `escena` tenía la dependencia transitiva `ubicacion → tipo_lugar`. Con las decisiones del equipo, la IA generó `database/detective.sql` (9 tablas), `npm run db:init` y `npm run db:reset`, 50 tests con `node:test` y `docs/modelo-datos.md` con el MER en Mermaid para pasarlo a Miro. Una verificación independiente encontró que Elisa quedaba incriminada sin prueba exculpatoria y que la matriz seguía señalando a la culpable en un paso; se corrigió con dos evidencias nuevas y una condición de horario en el veredicto.
- **Decisión:** el equipo eligió la tabla `lugar` frente a las alternativas (agregar `UNIQUE` o dejarlo igual). El MER generado por la IA debe ser revisado y dibujado por el equipo en Miro. Pendiente de revisión del equipo en el PR.
