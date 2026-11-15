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

### 2026-11-15 — Revisión del modelo relacional

- **Integrante:** Ignacio Nicolas Basilio Buracco.
- **Fase:** MER y modelo relacional.
- **Pedido:** analizar el alcance de la consigna, detectar contradicciones y revisar las ocho tablas propuestas por el equipo antes de escribir el script SQL.
- **Respuesta:** `docs/revision-modelo.md` con nueve hallazgos sobre la consigna, revisión tabla por tabla, cardinalidades, políticas `ON DELETE` / `ON UPDATE`, justificación de 3FN y ubicación de cada regla en la base. Propone una tabla `lugar`, nuevas columnas en `sospechoso`, `escena` y `caso`, y seis decisiones para que el equipo confirme.
- **Decisión:** pendiente de revisión del equipo en el PR.
