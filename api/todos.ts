import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, type TodoRow } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const rows = (await sql`
        select id::text, title, completed, created_at
        from todos
        order by created_at desc, id desc
      `) as TodoRow[];
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const raw: unknown = (req.body as { title?: unknown } | undefined)?.title;
      const title = typeof raw === 'string' ? raw.trim() : '';
      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }
      if (title.length > 500) {
        return res.status(400).json({ error: 'title must be 500 characters or fewer' });
      }

      const rows = (await sql`
        insert into todos (title)
        values (${title})
        returning id::text, title, completed, created_at
      `) as TodoRow[];
      return res.status(201).json(rows[0]);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: `${req.method} not allowed` });
  } catch (err) {
    console.error('[api/todos]', err);
    return res.status(500).json({ error: 'internal server error' });
  }
}
