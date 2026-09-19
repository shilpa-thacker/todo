import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, type TodoRow } from '../_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!rawId || !/^\d+$/.test(rawId)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  try {
    if (req.method === 'PATCH') {
      const body = (req.body ?? {}) as { title?: unknown; completed?: unknown };

      let title: string | null = null;
      if (body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
          return res.status(400).json({ error: 'title must be a non-empty string' });
        }
        title = body.title.trim();
      }

      let completed: boolean | null = null;
      if (body.completed !== undefined) {
        if (typeof body.completed !== 'boolean') {
          return res.status(400).json({ error: 'completed must be a boolean' });
        }
        completed = body.completed;
      }

      if (title === null && completed === null) {
        return res.status(400).json({ error: 'nothing to update' });
      }

      const rows = (await sql`
        update todos
        set title     = coalesce(${title}, title),
            completed = coalesce(${completed}, completed)
        where id = ${rawId}::bigint
        returning id::text, title, completed, created_at
      `) as TodoRow[];

      if (!rows.length) return res.status(404).json({ error: 'todo not found' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const rows = (await sql`
        delete from todos where id = ${rawId}::bigint returning id::text
      `) as Pick<TodoRow, 'id'>[];

      if (!rows.length) return res.status(404).json({ error: 'todo not found' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: `${req.method} not allowed` });
  } catch (err) {
    console.error('[api/todos/:id]', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
