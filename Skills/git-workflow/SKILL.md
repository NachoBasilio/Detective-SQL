---
name: git-workflow
description: >
  Flujo de ramas, commits y pull requests de Detective SQL. Usar al crear una
  rama, escribir un commit o abrir o editar un pull request. Los PR se escriben
  siempre en español y apuntan a dev.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "crear rama"
    - "hacer commit"
    - "abrir PR"
    - "pull request"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: medium
  allowed_tools:
    - bash
---

# git-workflow

## Cuándo usar

- Crear una rama de trabajo.
- Escribir un mensaje de commit.
- Abrir o actualizar un pull request.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: fija una decisión del equipo sobre cómo se colabora en el repo. No caduca cuando mejora el modelo; solo cambia si el equipo cambia el flujo.

## Cuándo NO usar

- Consultas de solo lectura sobre el historial (`git log`, `git diff`, `git status`).

## Ramas

- `main`: versión entregable. Solo recibe merges desde `dev`.
- `dev`: integración. Todo PR de trabajo apunta a `dev`.
- Ramas de trabajo: salen de `dev` y se llaman `tipo/descripcion` en minúsculas, por ejemplo `feat/esquema-sql` o `docs/mer`. Deben cumplir `^(feat|fix|chore|docs|refactor|test|ci)\/[a-z0-9._-]+$`.

## Commits

- Formato Conventional Commits: `tipo(alcance opcional): descripción`.
- El tipo va en inglés (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`); la descripción va en español, en minúscula y en infinitivo. Ejemplo: `feat(db): agregar tabla Sospechoso_Evidencia`.
- Un commit = un cambio coherente con sus pruebas y su documentación.

## Pull requests

- **PR en español:** título y descripción de todo pull request se escriben en español, sin excepción.
- El título usa el formato de commit: `feat(db): agregar esquema inicial`.
- Base del PR: `dev`. La única excepción es el PR de entrega `dev` → `main`.
- Descripción con estas secciones:

```markdown
## Resumen

- Qué cambia y por qué (de 1 a 3 puntos).

## Cambios

| Archivo | Cambio |
|---|---|
| `ruta/al/archivo` | Qué se modificó |

## Cómo probarlo

- [ ] Comandos o pasos reales que se ejecutaron.

## Uso de IA

- Entrada en `docs/bitacora-ia.md`: sí / no (motivo).
```

## Reglas críticas

- Nunca commitear ni pushear directo a `main` ni a `dev`.
- Nunca usar `git push --force` sobre `main` ni sobre `dev`.
- No mezclar en un mismo PR cambios de fases distintas (por ejemplo, esquema SQL y frontend).

## Checklist rápido

- [ ] Rama creada desde `dev` con nombre válido.
- [ ] Commits en Conventional Commits con descripción en español.
- [ ] PR hacia `dev` con título y descripción en español.
- [ ] Sección "Uso de IA" completa.

## Comandos

```bash
git switch dev && git pull
git switch -c feat/descripcion
git push -u origin feat/descripcion
# Con GitHub CLI (o desde la web de GitHub):
gh pr create --base dev --title "feat(alcance): descripción en español" --body-file descripcion.md
```
