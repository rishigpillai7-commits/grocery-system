import { memo, useRef, useState } from 'react';

// Tasks of one milestone. Parent owns the data; this component only reports events (props down, callbacks up).
function TaskList({ milestoneId, tasks, locked, onToggle, onAdd, onDelete }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const ok = await onAdd(milestoneId, title.trim());
    if (ok) {
      setTitle('');
      inputRef.current?.focus(); // useRef: put the cursor back for the next task
    }
  };

  return (
    <div className="tasks">
      {tasks.length === 0 && <p className="muted small">No tasks yet.</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t.id} className={t.isDone ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={t.isDone} onChange={() => onToggle(t)} />
              <span>{t.title}</span>
            </label>
            {!locked && (
              <button className="link-btn" onClick={() => onDelete(t.id)} aria-label="Delete task">✕</button>
            )}
          </li>
        ))}
      </ul>
      {!locked && (
        <form className="inline-form" onSubmit={submit}>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            maxLength={200}
          />
          <button className="btn btn-small" type="submit">Add</button>
        </form>
      )}
    </div>
  );
}

export default memo(TaskList);
