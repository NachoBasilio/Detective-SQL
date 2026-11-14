---
name: sqlite-schema
description: >
  Requisitos y reglas de SQLite para el esquema, los datos, las consultas, la
  vista y la transacción de Detective SQL. Usar al diseñar o modificar
  database/detective.sql, el MER, el modelo relacional o cualquier consulta.
license: Apache-2.0
metadata:
  author: equipo-detective-sql
  version: "1.0.0"
  scope:
    - root
  auto_invoke:
    - "crear tabla"
    - "modificar esquema"
    - "consulta SQL"
    - "vista"
    - "transacción"
    - "MER"
  owner: equipo-detective-sql
  skill_type: encoded_preference
  risk_level: high
  allowed_tools:
    - read
    - bash
    - apply_patch
---

# sqlite-schema

## Cuándo usar

- Diseñar o revisar el MER, el modelo relacional o la normalización.
- Escribir o modificar `database/detective.sql`.
- Escribir consultas, vistas, triggers o transacciones.

## Explicación para usuarios nuevos

Esta skill es de tipo `encoded_preference`: codifica los requisitos de la consigna y las decisiones del equipo sobre la base. No caduca con mejoras del modelo porque la consigna no cambia.

## Cuándo NO usar

- Código de Express o del frontend que solo consume la base: usar `Skills/express-api/SKILL.md`.

## Requisitos de la consigna (checklist de entrega)

- [ ] Mínimo 6 tablas, normalizadas hasta 3FN.
- [ ] Relación N:M `Sospechoso_Evidencia` con atributos propios.
- [ ] PK, FK, `NOT NULL`, `UNIQUE`, `CHECK` y políticas `ON DELETE` / `ON UPDATE` explícitas.
- [ ] Datos mínimos: 1 caso, 4 sospechosos, 3 escenas y 8 evidencias.
- [ ] Al menos 3 reglas del juego impuestas por la base.
- [ ] 10 consultas, incluidas las 3 investigaciones obligatorias: descarte de coartadas, matriz de evidencias y veredicto final.
- [ ] Entre las 10 consultas: un JOIN de 3 tablas, un anti-join, una subconsulta escalar y una agrupación con `HAVING`.
- [ ] Una acción de múltiples operaciones con `COMMIT` y un ejemplo de `ROLLBACK` (propuesta: registrar la acusación en `Orden_Arresto` y actualizar el estado del caso en la misma transacción).
- [ ] Al menos una `VIEW` utilizada por la aplicación.
- [ ] Script completo ejecutable sobre una base vacía.

## Reglas críticas de SQLite

- **Claves foráneas:** SQLite no las aplica por defecto. El script debe empezar con `PRAGMA foreign_keys = ON;` y el backend debe activarlo en cada conexión.
- **Restricciones en el `CREATE TABLE`:** SQLite no soporta `ALTER TABLE ... ADD CONSTRAINT`; toda restricción se declara al crear la tabla.
- **Dominios con `CHECK`:** SQLite usa afinidad de tipos y no valida tipos por sí solo; usar `CHECK` para estados y booleanos, por ejemplo `CHECK (es_culpable IN (0, 1))`.
- **Reglas que exceden un `CHECK`:** usar índices únicos parciales (por ejemplo, un solo culpable por caso: `CREATE UNIQUE INDEX ... WHERE es_culpable = 1`) o triggers con `RAISE(ABORT, 'mensaje')`.
- **Orden del script:** crear las tablas en orden de dependencia y cargar los datos después del esquema.
- **Límites de la IA:** en el MER solo puede revisar y criticar; el equipo construye el diseño. Ver `Skills/bitacora-ia/SKILL.md`.
- **PR en español:** título y descripción de todo pull request se escriben en español (ver `Skills/git-workflow/SKILL.md`).

## Checklist rápido

- [ ] El script corre sin errores sobre una base vacía.
- [ ] Una inserción que viola una regla del juego falla en la base, no en la aplicación.
- [ ] Cada cambio de modelo quedó documentado para el informe.

## Comandos

```bash
# Ejecutar el script sobre una base en memoria y frenar ante el primer error
# (requiere el CLI sqlite3):
sqlite3 -bail :memory: < database/detective.sql
# Pendiente de definir: npm run db:init
```
