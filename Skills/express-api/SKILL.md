---
name: express-api
description: >
  Reglas del backend Node.js + Express de Detective SQL para acceder a SQLite.
  Usar al crear o modificar rutas, controladores, la conexión a la base o el
  servidor que sirve el frontend.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "crear endpoint"
    - "crear ruta"
    - "controlador"
    - "conexión a la base"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: high
  allowed_tools:
    - read
    - bash
    - apply_patch
---

# express-api

## Cuándo usar

- Crear o modificar archivos en `backend/` (rutas, controladores, conexión).
- Exponer datos de la base al frontend.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: fija cómo la aplicación respeta las reglas que impone la consigna sobre la base. No caduca con mejoras del modelo.

## Cuándo NO usar

- Diseño del esquema o de las consultas: usar `Skills/sqlite-schema/SKILL.md`.

## Reglas críticas

- **Consultas parametrizadas siempre:** usar placeholders (`?`); nunca concatenar valores en el SQL.
- **No duplicar reglas de la base:** no validar en JavaScript lo que ya impone un `CHECK`, `UNIQUE`, FK o trigger. Capturar el error de SQLite y traducirlo a una respuesta HTTP clara.
- **Transacciones completas:** `BEGIN` → operaciones → `COMMIT`; ante cualquier error, `ROLLBACK` y propagar el error.
- **Claves foráneas activas:** ejecutar `PRAGMA foreign_keys = ON;` al abrir cada conexión.
- **Culpable oculto:** ninguna respuesta incluye `es_culpable` antes de la acusación. Seleccionar columnas explícitas (no `SELECT *` sobre sospechosos) o leer desde la `VIEW` pública. El veredicto se calcula en el backend consultando la base.
- **El esquema no se toca desde el código:** nada de `CREATE` ni `ALTER` en tiempo de ejecución; el esquema solo lo crea `db:init` a partir de `database/detective.sql`.
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Alcance de la aplicación

Cuatro pantallas, todas alimentadas por la API:

1. Expediente del caso: historia del crimen y sospechosos.
2. Investigación: escenas, evidencias, interrogatorios y coartadas.
3. Acusación: elegir un sospechoso y emitir la orden de arresto.
4. Resultado: veredicto consultado en la base.

## Checklist rápido

- [ ] Toda consulta usa parámetros.
- [ ] Ninguna respuesta previa al arresto expone al culpable.
- [ ] Las operaciones de varias sentencias hacen `ROLLBACK` ante error.
- [ ] No hay reglas de negocio duplicadas en JavaScript.

## Comandos

```bash
# Pendientes de definir hasta que exista el backend:
# npm run db:init
# npm start
```
