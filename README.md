# Detective SQL

Juego de detectives en el que cada pista, interrogatorio y arresto se resuelve con consultas SQL.

- **Frontend:** HTML, CSS y JavaScript
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** SQLite (archivo local, sin hosting externo)

## Participantes

- Ignacio Nicolas Basilio Buracco (41.175.914) — Scrum master
- Lucas Gabriel Ruiz (36.424.613) — Product Owner
- Laureano Damián Iglesias (38.636.342) — Desarrollador

## Inicio rápido

```bash
npm install        # instala las dependencias
npm run db:init    # crea database/detective.db con database/detective.sql
npm start          # levanta la API y el frontend
```

Abrir `http://localhost:3000` en el navegador. Para ejecutar los tests: `npm test`.

## Requisitos

| Requisito | Detalle |
|---|---|
| Node.js 22 o posterior | Lo exige `engines` en [`package.json`](package.json). npm viene incluido. Comprobar con `node --version`. |
| Git | Para clonar el repositorio. |
| SQLite | No hace falta instalarlo: la dependencia `better-sqlite3` trae SQLite y binarios precompilados para Windows, macOS y Linux (x64 y arm64). |
| `sqlite3` de línea de comandos | Opcional. Solo se usa para ejecutar el script a mano (ver [verificar la transacción](#cómo-verificar-la-transacción-y-el-rollback)). |

> Verificado el 2026-11-15 con Node.js 25.1.0 en Linux. Falta probar la instalación en Windows y con la versión de Node.js de cada integrante (ver [documentación técnica](docs/README-documentacion.md#13-matriz-de-pruebas-y-resultados-verificables)).

## Instalación desde cero

```bash
git clone https://github.com/NachoBasilio/Detective-SQL.git
cd Detective-SQL
npm install
```

`npm install` descarga Express, `better-sqlite3` y Supertest (solo para los tests). No se usan servicios externos, variables de entorno obligatorias ni archivos fuera del repositorio.

El archivo [`.npmrc`](.npmrc) define `ignore-scripts=true`. Sin él, npm intenta compilar `better-sqlite3` con `node-gyp` al instalar desde `package-lock.json`, y en Windows falla con `Could not find any Python installation to use`. La compilación no hace falta porque el paquete ya trae los binarios, y ninguna otra dependencia usa scripts de instalación. Los comandos `npm start`, `npm test` y `npm run ...` se ejecutan igual.

## Inicializar la base SQLite

| Comando | Qué hace |
|---|---|
| `npm run db:init` | Crea `database/detective.db`, ejecuta [`database/detective.sql`](database/detective.sql) completo (esquema, datos, consultas, transacciones y vista) con las claves foráneas activas y comprueba que cada caso con sospechosos tenga exactamente un culpable. Si la base ya existe, no la toca y termina con error. Si la creación falla, borra el archivo a medio crear. |
| `npm run db:reset` | **Operación destructiva.** Borra la base, con todas las partidas jugadas, y la vuelve a crear desde cero. |

- **Bases creadas antes de las correcciones de la auditoría (PR #6):** no tienen la columna `evidencia.lugar_acreditado_id` ni los triggers nuevos, y la API responde 500 al listar evidencias y al arrestar. Hay que recrearlas con `npm run db:reset` (operación destructiva: borra las partidas jugadas).
- La base es un archivo local que Git ignora (`*.db` en [`.gitignore`](.gitignore)); nunca se sube al repositorio.
- Para usar otra ruta, definir `DB_PATH` (relativa a la carpeta del proyecto o absoluta) en ese comando y también en `npm start`.

  En bash (Linux, macOS, WSL o Git Bash), la variable va delante de cada comando:

  ```bash
  DB_PATH=database/prueba.db npm run db:init
  DB_PATH=database/prueba.db npm start
  ```

  En Windows PowerShell, la variable se define primero y vale para todos los comandos siguientes de esa consola, hasta cerrarla:

  ```powershell
  $env:DB_PATH = "database\prueba.db"
  npm run db:init
  npm start
  ```

## Ejecutar el juego

```bash
npm start
```

- La consola muestra `Detective SQL disponible en http://localhost:3000`. Abrir esa dirección en el navegador.
- El mismo servidor responde la API (`/api/...`) y sirve el frontend (`/`).
- Para detenerlo, presionar `Ctrl+C` en la consola.
- Para otro puerto, definir `PORT`. En bash: `PORT=4000 npm start`. En Windows PowerShell:

  ```powershell
  $env:PORT = "4000"
  npm start
  ```
- Si la base no existe, el servidor no arranca y pide ejecutar `npm run db:init`.


## Ejecutar los tests

```bash
npm test
```

- Ejecuta 166 tests con el runner integrado de Node.js (`node:test`): 104 de base de datos (`tests/database/`), 49 de la API (`tests/api/`) y 13 del frontend (`tests/frontend/`: sistema visual, tema oscuro y traducción).
- Cada test crea su propia base en memoria (o un archivo temporal del sistema): no hace falta `db:init` ni `npm start`, y nunca se modifica `database/detective.db`.
- Para ejecutar un solo archivo: `node --test tests/database/consultas.test.js`.

Qué prueba cada test: [matriz de pruebas](docs/README-documentacion.md#13-matriz-de-pruebas-y-resultados-verificables).

## API REST

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "<mensaje en español>" }`.

| Método | URL | Devuelve |
|---|---|---|
| GET | `/api/health` | `{ "estado": "ok" }` si la base responde. |
| GET | `/api/casos` | Lista de casos. |
| GET | `/api/casos/:id` | Datos públicos del caso, con lugar y hora de la escena principal. |
| GET | `/api/casos/:id/sospechosos` | Sospechosos con relación con la víctima y coartada. Nunca incluye `es_culpable`. |
| GET | `/api/casos/:id/escenas` | Escenas del caso con su lugar y cantidad de evidencias. |
| GET | `/api/escenas/:id/evidencias` | Evidencias encontradas en una escena, cada una con su hora (`horaIndicio`), el lugar que acredita (`lugarAcreditado`, `null` si no acredita ninguno) y sus vínculos a sospechosos. |
| GET | `/api/sospechosos/:id/interrogatorios` | Declaraciones y contradicciones de un sospechoso. |
| GET | `/api/casos/:id/investigacion/coartadas` | Descarte de coartadas (consulta C1 filtrada por caso). |
| GET | `/api/casos/:id/investigacion/matriz` | Matriz de evidencias, leída de la vista `vista_matriz_evidencias`. |
| GET | `/api/partidas` | Partidas con `id`, `casoId`, `estado` y `fechaInicio`, de la más reciente a la más antigua. Filtros opcionales: `?estado=en_curso` y `?casoId=1` (un `casoId` que no es un entero positivo responde 400). Nunca incluye el acusado ni el culpable. El expediente la usa para retomar partidas en curso. |
| POST | `/api/partidas` | Crea una partida. Cuerpo: `{ "casoId": 1 }`. Responde 201. |
| GET | `/api/partidas/:id` | Estado de una partida (`en_curso`, `ganada` o `perdida`), sin el acusado ni el culpable. |
| POST | `/api/partidas/:id/arrestos` | Registra el arresto y cierra la partida. Cuerpo: `{ "sospechosoId": 3 }`. Responde 201 con el resultado y, recién ahí, el culpable. |

| Código | Cuándo |
|---|---|
| 400 | Identificador que no es un entero positivo, cuerpo inválido o sospechoso de otro caso. |
| 404 | Caso, escena, sospechoso o partida inexistente, o ruta desconocida de la API. |
| 409 | La partida ya terminó: solo se permite un arresto por partida. |
| 500 | Error interno, con un mensaje genérico y sin texto de SQL. |

La consulta que deduce el culpable (C3) no se expone como endpoint.

## Arquitectura

```text
Navegador (frontend/)  --fetch JSON-->  Express (backend/)  --SQL parametrizado-->  SQLite (database/detective.db)
```

- **Base de datos:** [`database/detective.sql`](database/detective.sql) es la única fuente del esquema. Las reglas del juego (un arresto por partida, sospechoso del mismo caso, resultado coherente) viven en restricciones y triggers.
- **Backend:** `routes/` define las URLs, `controllers/` valida el formato de la solicitud y traduce los errores de SQLite a códigos HTTP, y `services/` ejecuta las consultas. El arresto es una transacción real.
- **Frontend:** HTML, CSS y JavaScript sin frameworks. Cuatro pantallas (Expediente, Investigación, Acusación y Resultado) que leen todos los datos desde la API.

Detalle completo: [arquitectura en la documentación técnica](docs/README-documentacion.md#11-arquitectura-frontend-backend-y-base-de-datos).

## Cómo probar una partida

1. Ejecutar `npm run db:init` (o `npm run db:reset` para empezar de cero) y después `npm start`.
2. Abrir `http://localhost:3000`. La pantalla **Expediente** muestra el caso, la fecha y el lugar del crimen y los cuatro sospechosos.
3. Presionar **Iniciar partida**. La partida se registra en la base y el juego pasa a Investigación.
4. En **Investigación**, revisar las cuatro pestañas: escenas y evidencias, interrogatorios, coartadas y matriz de evidencias.
5. Presionar **Pasar a la acusación**, elegir un sospechoso, presionar **Revisar la orden de arresto** y confirmar con **Emitir orden de arresto**.
6. La pantalla **Resultado** indica si la partida quedó `ganada` o `perdida` y quién era el culpable. **Iniciar una partida nueva** permite volver a jugar.

<details>
<summary>Solución del caso (solo para verificar)</summary>

La culpable es Carla Mendez (sospechoso 3). Arrestarla deja la partida `ganada`; arrestar a cualquier otro sospechoso la deja `perdida`.

</details>

La misma partida se puede jugar desde la consola con `curl` (en Windows, desde Git Bash). La base recién creada ya tiene una partida de demostración (id 1), así que la primera partida nueva es la 2:

```bash
curl -X POST http://localhost:3000/api/partidas -H "Content-Type: application/json" -d '{"casoId": 1}'
curl -X POST http://localhost:3000/api/partidas/2/arrestos -H "Content-Type: application/json" -d '{"sospechosoId": 3}'
curl http://localhost:3000/api/partidas/2
```

Un segundo `POST` a `/api/partidas/2/arrestos` responde 409 y el resultado no cambia.

## Cómo verificar la transacción y el ROLLBACK

Al insertar la acusación, el trigger `trg_acusacion_cerrar_partida` cierra la partida en esa misma sentencia: si el cierre falla, SQLite revierte también la acusación. El arresto de la aplicación agrupa ese `INSERT` y las lecturas posteriores en una transacción: si un paso posterior falla, el `ROLLBACK` deshace la acusación y el cierre.

| Qué verificar | Cómo | Resultado esperado |
|---|---|---|
| Demostraciones del script (`COMMIT` y `ROLLBACK`) | `node --test tests/database/transacciones.test.js` | 6 tests aprobados: el script no cierra la partida con un `UPDATE` (lo hace el trigger), la partida demo queda `perdida`, el caso sigue abierto, el `ROLLBACK` no deja filas, una transacción fallida no deja la partida del intento y la base sigue jugable. |
| Cierre atómico sin `BEGIN` | `node --test --test-name-pattern="sentencia INSERT se revierte" tests/database/restricciones.test.js` | 1 test aprobado. Un trigger temporal hace fallar el cierre automático: el `INSERT` se rechaza completo, sin acusación y con la partida `en_curso`. |
| `ROLLBACK` de la aplicación ante una falla real | `node --test --test-name-pattern="ROLLBACK" tests/api/partidas.test.js` | 1 test aprobado. El test fuerza una falla en la primera lectura posterior al `INSERT`, cuando la acusación y el cierre automático ya se ejecutaron: la API responde 500 sin texto de SQL, la acusación no queda guardada y la partida sigue `en_curso`. |
| El script a mano (opcional, requiere `sqlite3`) | `sqlite3 -bail -header -column :memory: ".read database/detective.sql"` | Antes del `COMMIT` se ve la partida 1 ya `perdida` (`estado_antes_del_commit`), sin ningún `UPDATE`. Al final se ve la partida 1 `perdida` contra Diego Salas con el caso `abierto`, y `partidas_descartadas` y `acusaciones_descartadas` en 0. Se ejecuta en memoria: no modifica la base del juego. |
| Desde el juego en marcha | Repetir el arresto de una partida terminada, o arrestar un sospechoso inexistente (`{ "sospechosoId": 99 }`) en una partida en curso. | 409 en el primer caso y 404 en el segundo. Con `GET /api/partidas/:id`, la primera sigue con su resultado original y la segunda sigue `en_curso`. |

Explicación completa: [transacciones y ROLLBACK](docs/README-documentacion.md#9-explicación-de-transacciones-y-rollback).

## Estructura del proyecto

```text
Detective-SQL/
├── backend/
│   ├── server.js             # Punto de entrada de npm start (DB_PATH, PORT)
│   ├── app.js                # Aplicación Express: API bajo /api y frontend estático
│   ├── routes/               # URLs de cada recurso
│   ├── controllers/          # Validación de formato y traducción de errores a HTTP
│   ├── services/             # Consultas SQL parametrizadas y transacción de arresto
│   └── database/
│       └── crear-base.js     # Crea una base ejecutando database/detective.sql
├── database/
│   └── detective.sql         # Esquema, datos semilla, 10 consultas, transacciones y vista
├── docs/
│   ├── README-documentacion.md  # Documentación técnica, base del informe
│   ├── modelo-datos.md       # MER (Mermaid), modelo relacional y 3FN
│   ├── design.md             # Sistema visual del frontend
│   └── bitacora-ia.md        # Registro del uso de IA
├── frontend/
│   ├── index.html            # Las cuatro pantallas del juego
│   ├── css/estilos.css
│   └── js/                   # app.js, api.js, dom.js y un módulo por pantalla
├── scripts/
│   ├── init-db.js            # npm run db:init y npm run db:reset
│   └── validate-skills.sh    # npm run validate:skills
├── tests/
│   ├── database/             # Esquema, datos, consultas, inicialización, restricciones y transacciones
│   ├── api/                  # Endpoints, arrestos y aplicación Express
│   └── helpers/              # Utilidades compartidas por los tests
├── Skills/                   # Skills para agentes de IA (ver AGENTS.md)
├── .github/workflows/        # Validación automática de las skills
├── AGENTS.md                 # Reglas para agentes de IA
├── CLAUDE.md                 # Importa AGENTS.md
├── package.json
└── README.md
```

## Documentación

- [`docs/README-documentacion.md`](docs/README-documentacion.md): documentación técnica completa (reglas, modelo, diccionario de datos, consultas, transacciones, pruebas). Es la base del informe final.
- [`docs/modelo-datos.md`](docs/modelo-datos.md): MER en Mermaid, modelo relacional y normalización.
- [`docs/design.md`](docs/design.md): sistema visual del frontend.

## Uso de IA

- Las reglas para agentes están en [`AGENTS.md`](AGENTS.md); [`CLAUDE.md`](CLAUDE.md) lo importa para que todos los agentes lean las mismas reglas.
- Las skills del proyecto están en `Skills/<nombre>/SKILL.md`.
- Todo uso relevante de IA se registra en [`docs/bitacora-ia.md`](docs/bitacora-ia.md), como exige la consigna.
- `npm run validate:skills` valida las skills y los documentos para agentes.
