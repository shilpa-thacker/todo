-- Run this once against your Neon database.
--   psql "$DATABASE_URL" -f db/schema.sql
-- or paste it into the Neon SQL Editor.

create table if not exists todos (
  id          bigint generated always as identity primary key,
  title       text        not null check (length(trim(title)) > 0),
  completed   boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Supports the default listing order (newest first).
create index if not exists todos_created_at_idx on todos (created_at desc);
