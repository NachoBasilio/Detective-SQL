# AGENTS.md

Reglas operativas para cualquier agente de IA (Claude Code, Codex, OpenCode, Gemini, etc.) que trabaje en Detective SQL. `CLAUDE.md` importa este archivo; no duplicar reglas en él.

## Alcance

Trabajo práctico universitario: juego de detectives resuelto con SQL. Stack, estructura y comandos: ver [`README.md`](README.md). Entrega: 16/11/2026.

## Fuente de verdad (orden de precedencia)

1. Solicitud explícita del usuario.
2. Este `AGENTS.md`.
3. `Skills/*/SKILL.md`.
4. `README.md`.

Si dos fuentes se contradicen, gana la de mayor precedencia.

## Reglas obligatorias

1. **La base de datos manda.** El modelo y `database/detective.sql` se cierran antes que el backend y el frontend. Nunca modificar el esquema desde el código para simplificar la aplicación; si el modelo necesita cambios, se revisan con el equipo y se documentan.
2. **Las reglas del juego viven en SQL.** La aplicación no duplica restricciones que impone la base, usa consultas parametrizadas y hace `ROLLBACK` ante errores.
3. **El culpable no sale del backend antes del arresto.** La API nunca envía `es_culpable` (ni un dato equivalente) al frontend antes de la acusación.
4. **El uso de IA respeta los límites de cada fase y queda registrado** en [`docs/bitacora-ia.md`](docs/bitacora-ia.md).
5. **PR en español:** título y descripción de todo pull request se escriben en español; las ramas salen de `dev` y nunca se commitea directo a `main` ni a `dev`.

## Auto-invocar skills

Antes de actuar, leer el `SKILL.md` que corresponda al contexto:

| Contexto | Skill |
|---|---|
| Diseñar o modificar tablas, restricciones, triggers, consultas, vistas o transacciones | [`Skills/sqlite-schema/SKILL.md`](Skills/sqlite-schema/SKILL.md) |
| Crear o modificar rutas, controladores o el acceso a la base desde Node | [`Skills/express-api/SKILL.md`](Skills/express-api/SKILL.md) |
| Diseñar, crear o revisar pantallas, componentes, estilos o interacciones en `frontend/` | [`Skills/ui-ux/SKILL.md`](Skills/ui-ux/SKILL.md) |
| Crear ramas, commits o pull requests | [`Skills/git-workflow/SKILL.md`](Skills/git-workflow/SKILL.md) |
| Cualquier tarea en la que la IA proponga, genere o corrija algo | [`Skills/bitacora-ia/SKILL.md`](Skills/bitacora-ia/SKILL.md) |
| Crear o migrar una skill | [`Skills/skill-creator/SKILL.md`](Skills/skill-creator/SKILL.md) |
| Después de crear o modificar skills | [`Skills/skill-sync/SKILL.md`](Skills/skill-sync/SKILL.md) |

## Definition of done

Cambio validado con los comandos reales del repo (`npm run validate:skills` si se tocaron skills o estos documentos), entrada nueva en `docs/bitacora-ia.md` y PR hacia `dev` escrito en español.
