---
name: bitacora-ia
description: >
  Límites de uso de IA por fase y registro obligatorio en docs/bitacora-ia.md.
  Usar en toda tarea en la que un agente de IA proponga, genere, revise o
  corrija algo del proyecto Detective SQL.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "uso de IA"
    - "bitácora"
    - "registrar pedido"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: medium
  allowed_tools:
    - read
    - apply_patch
---

# bitacora-ia

## Cuándo usar

- Al terminar cualquier tarea en la que la IA haya intervenido.
- Antes de pedirle a la IA algo del MER o del modelo relacional, para respetar los límites de la fase.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: la consigna exige documentar el uso de IA y fija qué puede hacer en cada fase. No caduca con mejoras del modelo.

## Cuándo NO usar

- Preguntas que no producen ni cambian nada del proyecto.

## Límites por fase (consigna)

| Fase | Qué puede hacer la IA |
|---|---|
| 1. MER | Revisar y criticar. El equipo construye y entiende el diseño. |
| 2. Modelo relacional | Ayudar a revisar la normalización y detectar errores. |
| 3. SQL | Ayudar con sintaxis, consultas y corrección de errores. |
| 4. Aplicación | Desarrollar gran parte del código. |

## Reglas críticas

- En las fases 1 y 2 el agente no entrega el diseño resuelto: señala problemas y explica por qué.
- Cada decisión que tome o proponga la IA se explica, para que cualquier integrante pueda defenderla.
- Registrar los pedidos importantes, no cada mensaje.
- Ser fiel: si se rechazó o corrigió lo que propuso la IA, dejarlo escrito.
- No registrar qué herramienta ni qué modelo de IA se usó.
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Formato de cada entrada

Agregar al final de `docs/bitacora-ia.md`:

```markdown
### AAAA-MM-DD — Título breve

- **Integrante:** quién hizo el pedido.
- **Fase:** MER | Modelo relacional | SQL | Aplicación | Organización.
- **Pedido:** qué se pidió.
- **Respuesta:** qué propuso o generó la IA.
- **Decisión:** aceptado, corregido o rechazado, y por qué.
```

## Checklist rápido

- [ ] Se respetó el límite de la fase.
- [ ] La entrada tiene pedido, respuesta y decisión.
- [ ] El PR menciona la entrada en su sección "Uso de IA".
