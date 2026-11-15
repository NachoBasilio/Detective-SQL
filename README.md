# Detective SQL

A detective game where every clue, interrogation and arrest is resolved through SQL.

- **Frontend:** HTML, CSS and vanilla JavaScript
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite (local file, no external hosting)

> Work in progress. Setup instructions will be added once the backend and database scripts exist.

## Project structure

```text
detective-sql/
├── frontend/            # Static UI served by the backend
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/             # Express REST API
│   ├── server.js
│   ├── routes/          # HTTP route definitions
│   ├── controllers/     # Request handlers
│   └── database/        # SQLite connection and db:init script
├── database/
│   └── detective.sql    # Full schema + seed data, runnable on an empty database
├── docs/                # Report, ER model (MER) and relational model (MR)
├── package.json
└── README.md
```

## Planned commands

```bash
npm install
npm run db:init   # create and seed a fresh SQLite database from database/detective.sql
npm start         # start the API and serve the frontend
```
