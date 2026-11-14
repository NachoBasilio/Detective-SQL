---
name: skill-creator
description: >
  Crea skills nuevas en formato Skills/<nombre>/SKILL.md con metadata válida y
  enfoque anti-ruido. Usar cuando se pida crear una skill, migrar una skill o
  estandarizar su estructura.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "crear skill"
    - "nueva skill"
    - "migrar skill"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: medium
  allowed_tools:
    - read
    - glob
    - apply_patch
---

# skill-creator

## Cuándo usar

- Crear una skill reutilizable para el proyecto.
- Estandarizar metadata y estructura de una skill existente.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: fija cómo el equipo escribe skills. No caduca con mejoras del modelo.

## Cuándo NO usar

- Tareas puntuales o triviales.
- Casos en los que ya existe una skill equivalente.

## Contrato de salida

1. Carpeta `Skills/<nombre>/` con `SKILL.md` y frontmatter completo, partiendo de `Skills/skill-creator/assets/SKILL-template.md`.
2. Recursos opcionales (`assets/`, `references/`, `scripts/`) solo si aportan valor real.
3. Fila nueva en la tabla "Auto-invocar skills" de `AGENTS.md`.
4. Texto en español neutro y profesional.

## Restricciones del frontmatter

- `name`: cumple `^[a-z0-9-]{1,64}$` y coincide con el nombre de la carpeta.
- `description`: no vacía, de hasta 1024 caracteres, dice qué hace y cuándo usarla.
- `metadata.skill_type`: `encoded_preference` (preferencia estable del equipo) o `capability_uplift` (capacidad técnica temporal; exige `review_by` y se recomienda `sunset_at`).
- El cuerpo debería quedar por debajo de ~5k tokens; lo que pese más va a `references/`.

## Reglas críticas

- Descripción concreta: prohibido "ayuda con código" o similares.
- Solo reglas accionables y verificables; nada de narrativa larga.
- No inventar comandos: si no existen, declararlos como "pendientes de definir".
- Toda skill nueva incluye la línea **PR en español:** en sus reglas críticas; el validador la exige.
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Checklist rápido

- [ ] No existe una skill equivalente.
- [ ] Nombre en kebab-case.
- [ ] Frontmatter completo y válido.
- [ ] Criterios de uso y de no uso.
- [ ] `AGENTS.md` actualizado.
- [ ] `npm run validate:skills` sin errores.

## Recursos

- Template base: `Skills/skill-creator/assets/SKILL-template.md`
