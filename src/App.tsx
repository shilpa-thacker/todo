import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from './api';
import type { Filter, Todo } from './types';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTodos(await api.listTodos());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || busy) return;

    setBusy(true);
    try {
      const created = await api.createTodo(title);
      setTodos((prev) => [created, ...prev]);
      setDraft('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(todo: Todo) {
    // Optimistic: flip locally, roll back if the server disagrees.
    const previous = todos;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
    );
    try {
      await api.updateTodo(todo.id, { completed: !todo.completed });
      setError(null);
    } catch (err) {
      setTodos(previous);
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  }

  async function remove(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.deleteTodo(id);
      setError(null);
    } catch (err) {
      setTodos(previous);
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  }

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'done') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <main className="app">
      <header className="app__header">
        <h1>Todo</h1>
        <p className="app__subtitle">
          {loading ? 'Loading…' : `${remaining} remaining of ${todos.length}`}
        </p>
      </header>

      <form className="composer" onSubmit={add}>
        <input
          className="composer__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
          maxLength={500}
          aria-label="New todo"
        />
        <button className="composer__submit" type="submit" disabled={!draft.trim() || busy}>
          Add
        </button>
      </form>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <nav className="filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`filters__tab${filter === key ? ' is-active' : ''}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {!loading && visible.length === 0 ? (
        <p className="empty">
          {todos.length === 0 ? 'Nothing here yet. Add your first todo above.' : 'No todos match this filter.'}
        </p>
      ) : (
        <ul className="list">
          {visible.map((todo) => (
            <li key={todo.id} className={`item${todo.completed ? ' is-done' : ''}`}>
              <label className="item__main">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => void toggle(todo)}
                />
                <span className="item__title">{todo.title}</span>
              </label>
              <button
                type="button"
                className="item__delete"
                onClick={() => void remove(todo.id)}
                aria-label={`Delete "${todo.title}"`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
