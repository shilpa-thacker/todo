export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export type Filter = 'all' | 'active' | 'done';
