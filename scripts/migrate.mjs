// Applies db/schema.sql to the database in DATABASE_URL.
// Run with:  npm run migrate
//
// The schema is written to be idempotent (create ... if not exists), so
// re-running is safe.

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}

const sql = neon(url);
const source = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');

// Strip full-line comments, then split on statement terminators. Fine for this
// schema; it would need a real parser if we ever add dollar-quoted functions.
const statements = source
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  const label = statement.replace(/\s+/g, ' ').slice(0, 60);
  process.stdout.write(`  ${label}… `);
  await sql.query(statement);
  console.log('ok');
}

console.log(`\nApplied ${statements.length} statement(s).`);
