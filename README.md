# Todo

A small todo app: React + TypeScript + Vite on the front end, Vercel serverless
functions on the back end, Neon Postgres for storage.

## Layout

```
api/
  _db.ts          Neon client (underscore prefix = not routed as an endpoint)
  todos.ts        GET  /api/todos      list
                  POST /api/todos      create
  todos/[id].ts   PATCH  /api/todos/:id   toggle or rename
                  DELETE /api/todos/:id   remove
db/schema.sql     Table definition — run once against your database
src/              React app (App.tsx, api.ts, types.ts, index.css)
```

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Point at a database.** Either pull the values Vercel already holds:

   ```bash
   vercel env pull .env.local
   ```

   or copy `.env.example` to `.env.local` and paste your Neon connection string.
   Use the **pooled** string (the host contains `-pooler`) — serverless functions
   open many short-lived connections and will exhaust a direct connection.

3. **Create the table**

   ```bash
   psql "$env:DATABASE_URL" -f db/schema.sql
   ```

   No `psql` handy? Paste `db/schema.sql` into the Neon SQL Editor instead.

## Running locally

```bash
vercel dev
```

`vercel dev` serves the Vite front end *and* the `api/` functions together on
one port, which is what you want.

`npm run dev` starts Vite alone — the UI renders but every request to `/api/*`
returns a 404, because nothing is serving those routes. Use it only for pure
styling work.

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Vite only (no API)                        |
| `npm run dev:full`  | `vercel dev` — full stack                 |
| `npm run build`     | Production build to `dist/`               |
| `npm run preview`   | Serve the built `dist/`                   |
| `npm run typecheck` | `tsc --noEmit` across `src/` and `api/`   |

## Notes

- `id` is a Postgres `bigint`, serialized as a **string** in JSON. JavaScript
  numbers lose precision past 2^53, so the API casts with `id::text` and the
  client treats ids as opaque strings.
- Toggle and delete are optimistic — the UI updates immediately and rolls back
  if the request fails.
- `.env.local` is gitignored. Only `.env.example` is tracked.
