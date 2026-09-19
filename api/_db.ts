import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Run `vercel env pull .env.local`, or copy .env.example to .env.local and fill it in.',
  );
}

export const sql = neon(connectionString);

export type TodoRow = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};
