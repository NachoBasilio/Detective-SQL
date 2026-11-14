# Detective SQL

Juego de detectives en el que cada pista, interrogatorio y arresto se resuelve con consultas SQL.

- **Frontend:** HTML, CSS y JavaScript
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** SQLite (archivo local, sin hosting externo)

> En desarrollo. Las instrucciones de instalación se completarán cuando existan el backend y los scripts de la base de datos.

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
├── docs/                # Informe, MER y modelo relacional (MR)
├── package.json
└── README.md
```

## Comandos previstos

```bash
npm install
npm run db:init   # crea y carga una base SQLite nueva a partir de database/detective.sql
npm start         # levanta la API y sirve el frontend
```
