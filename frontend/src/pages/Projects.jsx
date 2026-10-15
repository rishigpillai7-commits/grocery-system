import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';
import ProjectCard from '../components/ProjectCard.jsx';
import StateMessage from '../components/StateMessage.jsx';

const LIMIT = 6;
const EMPTY = { search: '', status: '', minBudget: '', maxBudget: '', sortBy: 'createdAt', order: 'desc', mine: true };

export default function Projects() {
  const { user } = useApp();
  const [draft, setDraft] = useState(EMPTY); // what the form shows
  const [applied, setApplied] = useState(EMPTY); // what was submitted -> triggers the fetch
  const [page, setPage] = useState(1);

  // Query string for the backend's advanced filtering endpoint.
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (applied.search) p.set('search', applied.search);
    if (applied.status) p.set('status', applied.status);
    if (applied.minBudget) p.set('minBudget', applied.minBudget);
    if (applied.maxBudget) p.set('maxBudget', applied.maxBudget);
    p.set('sortBy', applied.sortBy);
    p.set('order', applied.order);
    if (applied.mine) p.set(user.role === 'client' ? 'clientId' : 'freelancerId', user.id);
    p.set('page', page);
    p.set('limit', LIMIT);
    return p.toString();
  }, [applied, page, user]);

  const { data, loading, error, reload } = useFetch(`/projects?${query}`);

  const change = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setDraft((d) => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const apply = (e) => {
    e.preventDefault();
    setApplied(draft);
    setPage(1);
  };

  const reset = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  };

  const totalPages = data ? Math.max(Math.ceil(data.total / LIMIT), 1) : 1;

  return (
    <div className="page">
      <div className="page-head">
        <h1>Projects</h1>
        {user.role === 'client' && <Link to="/projects/new" className="btn btn-primary">+ New project</Link>}
      </div>

      <form className="card filters" onSubmit={apply}>
        <input name="search" placeholder="Search title or description" value={draft.search} onChange={change} />
        <select name="status" value={draft.status} onChange={change}>
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input name="minBudget" type="number" min="0" placeholder="Min budget" value={draft.minBudget} onChange={change} />
        <input name="maxBudget" type="number" min="0" placeholder="Max budget" value={draft.maxBudget} onChange={change} />
        <select name="sortBy" value={draft.sortBy} onChange={change}>
          <option value="createdAt">Sort: newest</option>
          <option value="budget">Sort: budget</option>
          <option value="deadline">Sort: deadline</option>
          <option value="title">Sort: title</option>
        </select>
        <select name="order" value={draft.order} onChange={change}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <label className="check">
          <input name="mine" type="checkbox" checked={draft.mine} onChange={change} /> Only my projects
        </label>
        <div className="filter-actions">
          <button className="btn btn-primary" type="submit">Apply</button>
          <button className="btn btn-ghost" type="button" onClick={reset}>Reset</button>
        </div>
      </form>

      <StateMessage loading={loading && !data} error={error} onRetry={reload} />

      {data && (
        <>
          <p className="muted">{data.total} project{data.total === 1 ? '' : 's'} found</p>
          <div className="grid">
            {data.data.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {data.total === 0 && <p className="muted">Nothing matches these filters.</p>}

          {totalPages > 1 && (
            <div className="pager">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
