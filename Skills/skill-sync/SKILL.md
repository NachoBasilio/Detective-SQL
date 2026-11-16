---
name: skill-sync
description: >
  Audita y sincroniza las skills con AGENTS.md y CLAUDE.md. Usar después de
  crear o modificar una skill, o cuando la tabla de auto-invocación de
  AGENTS.md quedó desalineada.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "sincronizar skills"
    - "validar skills"
    - "actualizar AGENTS"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: medium
  allowed_tools:
    - read
    - glob
    - grep
    - bash
    - apply_patch
---

# skill-sync

## Cuándo usar

- Después de crear o modificar cualquier skill.
- Cuando `AGENTS.md` o `CLAUDE.md` quedan desalineados con `Skills/`.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: mantiene la coherencia que el equipo eligió entre documentos. No caduca con mejoras del modelo.

## Cuándo NO usar

- Cambios que no tocan skills ni documentos para agentes.

## Validaciones obligatorias

1. Estructura `Skills/<nombre>/SKILL.md` (con `S` mayúscula).
2. Metadata mínima: `name`, `description`, `license`, `metadata.author`, `metadata.version`, `metadata.scope`, `metadata.auto_invoke`, `metadata.owner`, `metadata.skill_type`, `metadata.risk_level`, `metadata.allowed_tools`.
3. Si `skill_type` es `capability_uplift`, existe `review_by`.
4. Cada skill activa tiene su fila en la tabla "Auto-invocar skills" de `AGENTS.md`, y cada fila apunta a una ruta existente.
5. `CLAUDE.md` importa `@AGENTS.md` y no agrega reglas propias.
6. Cada skill incluye la regla **PR en español:**.

## Reglas críticas

- No inventar scripts: si algo no está automatizado, dejarlo como pendiente explícito.
- Cambios pequeños y auditables; actualizar solo las secciones afectadas.
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Checklist rápido

- [ ] `npm run validate:skills` sin errores.
- [ ] La tabla de `AGENTS.md` refleja las skills reales.
- [ ] No hay referencias a rutas inexistentes.

## Comandos

```bash
npm run validate:skills
bash scripts/validate-skills.sh --dry-run   # solo auditoría, no falla
```
