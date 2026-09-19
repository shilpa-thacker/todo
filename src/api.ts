import type { Todo } from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Response had no JSON body; keep the status-based message.
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const listTodos = () => request<Todo[]>('/api/todos');

export const createTodo = (title: string) =>
  request<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });

export const updateTodo = (id: string, patch: { title?: string; completed?: boolean }) =>
  request<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const deleteTodo = (id: string) =>
  request<void>(`/api/todos/${id}`, { method: 'DELETE' });
