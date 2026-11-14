---
name: <nombre-de-la-skill>
description: >
  <Qué hace esta skill>. Usar cuando <contexto concreto de activación>.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "<acción o contexto>"
  owner: equipo-detective-sql
  skill_type: encoded_preference # encoded_preference | capability_uplift
  # review_by: "AAAA-MM-DD"      # obligatorio si skill_type es capability_uplift
  risk_level: low # low | medium | high
  allowed_tools: []
---

# <nombre-de-la-skill>

## Cuándo usar

- <caso 1>

## Explicación para usuarios nuevos

Esta skill es de tipo `<encoded_preference|capability_uplift>`. Explicar por qué aplica ese tipo y si debe caducar o mantenerse.

## Cuándo NO usar

- <caso fuera de alcance>

## Reglas críticas

- <regla 1>
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Checklist rápido

- [ ] <control 1>

## Comandos

```bash
# Reemplazar por comandos reales y verificables del repo.
npm run validate:skills
```
