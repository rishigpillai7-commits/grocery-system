import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';

const INITIAL = { title: '', description: '', budget: '', deadline: '', freelancerId: '' };

// Form -> POST /api/projects -> row inserted in MySQL.
export default function NewProject() {
  const { user, notify } = useApp();
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { data: freelancers } = useFetch('/freelancers');

  useEffect(() => {
    titleRef.current?.focus(); // useRef: focus the first field on mount
  }, []);

  if (user.role !== 'client') return <Navigate to="/projects" replace />;

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const project = await api.post('/projects', {
        title: form.title,
        description: form.description || null,
        budget: Number(form.budget),
        deadline: form.deadline || null,
        freelancerId: form.freelancerId ? Number(form.freelancerId) : null,
        clientId: user.id,
      });
      notify('Project created');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page narrow">
      <h1>New project</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          Title
          <input ref={titleRef} name="title" value={form.title} onChange={change} required minLength={3} maxLength={150} />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} value={form.description} onChange={change} />
        </label>
        <div className="row">
          <label>
            Budget (₹)
            <input name="budget" type="number" min="1" step="0.01" value={form.budget} onChange={change} required />
          </label>
          <label>
            Deadline
            <input name="deadline" type="date" value={form.deadline} onChange={change} />
          </label>
        </div>
        <label>
          Hire a freelancer (optional)
          <select name="freelancerId" value={form.freelancerId} onChange={change}>
            <option value="">Decide later</option>
            {(freelancers || []).map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.skills || 'no skills listed'}</option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">⚠ {error}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create project'}
        </button>
      </form>
    </div>
  );
}
