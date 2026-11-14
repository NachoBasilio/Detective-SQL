# Detective SQL

Juego de detectives en el que cada pista, interrogatorio y arresto se resuelve con consultas SQL.

- **Frontend:** HTML, CSS y JavaScript
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** SQLite (archivo local, sin hosting externo)

> En desarrollo. Las instrucciones de instalación se completarán cuando existan el backend y los scripts de la base de datos.

## Participantes

- Ignacio Nicolas Basilio Buracco (41.175.914) — Scrum master
- Lucas Gabriel Ruiz (36.424.613) — Product Owner
- Laureano Damián Iglesias (38.636.342)

## Estructura del proyecto

```text
detective-sql/
├── frontend/            # Interfaz estática que sirve el backend
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/             # API REST con Express
│   ├── server.js
│   ├── routes/          # Definición de rutas HTTP
│   ├── controllers/     # Manejo de las solicitudes
│   └── database/        # Conexión a SQLite y script db:init
├── database/
│   └── detective.sql    # Esquema completo y datos, ejecutable sobre una base vacía
├── docs/                # Informe, MER, modelo relacional (MR) y bitácora de IA
├── Skills/              # Skills para agentes de IA (ver AGENTS.md)
├── scripts/             # Scripts de soporte (validador de skills)
├── AGENTS.md            # Reglas para agentes de IA
├── CLAUDE.md            # Importa AGENTS.md para Claude Code
├── package.json
└── README.md
```

## Comandos previstos

```bash
npm install
npm run db:init           # crea y carga una base SQLite nueva a partir de database/detective.sql
npm start                 # levanta la API y sirve el frontend
npm run validate:skills   # valida las skills y los documentos para agentes (ya disponible)
```

## Uso de IA

- Las reglas para agentes están en [`AGENTS.md`](AGENTS.md); [`CLAUDE.md`](CLAUDE.md) lo importa para Claude Code.
- Las skills del proyecto están en `Skills/<nombre>/SKILL.md`.
- Todo uso relevante de IA se registra en [`docs/bitacora-ia.md`](docs/bitacora-ia.md), como exige la consigna.
