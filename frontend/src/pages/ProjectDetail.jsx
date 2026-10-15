import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';
import MilestoneCard from '../components/MilestoneCard.jsx';
import MilestoneForm from '../components/MilestoneForm.jsx';
import StateMessage from '../components/StateMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../utils/format';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, notify } = useApp();
  const { data: project, loading, error, reload } = useFetch(`/projects/${id}`);
  const { data: freelancers } = useFetch(user.role === 'client' ? '/freelancers' : null);
  const [pickedFreelancer, setPickedFreelancer] = useState('');

  // The signed-in user may only act on projects they own / are hired on.
  const role = useMemo(() => {
    if (!project) return 'viewer';
    if (user.role === 'client' && project.clientId === user.id) return 'client';
    if (user.role === 'freelancer' && project.freelancerId === user.id) return 'freelancer';
    return 'viewer';
  }, [project, user]);

  // Runs an API call, shows a toast and refreshes the data. Resolves to true on success.
  const run = useCallback(
    async (fn, okMessage) => {
      try {
        await fn();
        if (okMessage) notify(okMessage);
        reload();
        return true;
      } catch (err) {
        notify(err.message, 'error');
        return false;
      }
    },
    [notify, reload]
  );

  // useCallback keeps these references stable so memoised children (MilestoneCard, TaskList) don't re-render needlessly.
  const handleAction = useCallback(
    (milestoneId, action) =>
      run(() => api.post(`/milestones/${milestoneId}/action`, { action }), `Milestone updated: ${action}`),
    [run]
  );
  const handleDeleteMilestone = useCallback(
    (milestoneId) => run(() => api.del(`/milestones/${milestoneId}`), 'Milestone deleted'),
    [run]
  );
  const handleToggleTask = useCallback(
    (task) => run(() => api.put(`/tasks/${task.id}`, { isDone: !task.isDone })),
    [run]
  );
  const handleAddTask = useCallback(
    (milestoneId, title) => run(() => api.post(`/milestones/${milestoneId}/tasks`, { title })),
    [run]
  );
  const handleDeleteTask = useCallback((taskId) => run(() => api.del(`/tasks/${taskId}`)), [run]);

  const handleAddMilestone = useCallback(
    (values) => run(() => api.post(`/projects/${id}/milestones`, values), 'Milestone added'),
    [run, id]
  );

  const assignFreelancer = () =>
    run(() => api.put(`/projects/${id}`, { freelancerId: Number(pickedFreelancer) }), 'Freelancer assigned');

  const cancelProject = () => {
    if (window.confirm('Cancel this project?')) run(() => api.put(`/projects/${id}`, { status: 'cancelled' }), 'Project cancelled');
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project permanently?')) return;
    const ok = await run(() => api.del(`/projects/${id}`), 'Project deleted');
    if (ok) navigate('/projects');
  };

  if (!project) {
    return (
      <div className="page">
        <StateMessage loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const { escrow } = project;
  const budget = Number(project.budget);
  const releasedPct = budget ? Math.min((escrow.released / budget) * 100, 100) : 0;
  const escrowPct = budget ? Math.min((escrow.inEscrow / budget) * 100, 100) : 0;
  const isOpenForWork = ['open', 'in_progress'].includes(project.status);
  const canDelete = role === 'client' && project.milestones.every((m) => m.status === 'pending');

  return (
    <div className="page">
      <p><Link to="/projects">← All projects</Link></p>

      <div className="card">
        <div className="card-head">
          <h1>{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        <p>{project.description || <span className="muted">No description</span>}</p>
        <dl className="meta">
          <div><dt>Client</dt><dd>{project.client.name}{project.client.company ? ` · ${project.client.company}` : ''}</dd></div>
          <div><dt>Freelancer</dt><dd>{project.freelancer ? project.freelancer.name : 'Not assigned'}</dd></div>
          <div><dt>Deadline</dt><dd>{formatDate(project.deadline)}</dd></div>
          <div><dt>Budget</dt><dd>{formatMoney(project.budget)}</dd></div>
        </dl>

        <div className="progress" title="Released / in escrow">
          <div className="progress-released" style={{ width: `${releasedPct}%` }} />
          <div className="progress-escrow" style={{ width: `${escrowPct}%` }} />
        </div>
        <div className="legend">
          <span><i className="dot released" /> Released {formatMoney(escrow.released)}</span>
          <span><i className="dot escrow" /> In escrow {formatMoney(escrow.inEscrow)}</span>
          <span><i className="dot" /> Unfunded {formatMoney(escrow.unfunded)}</span>
          <span className="muted">Planned {formatMoney(escrow.allocated)} of {formatMoney(budget)}</span>
        </div>

        {role === 'client' && (
          <div className="actions">
            {!project.freelancer && isOpenForWork && (
              <>
                <select value={pickedFreelancer} onChange={(e) => setPickedFreelancer(e.target.value)}>
                  <option value="">Assign a freelancer…</option>
                  {(freelancers || []).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary" disabled={!pickedFreelancer} onClick={assignFreelancer}>Assign</button>
              </>
            )}
            {isOpenForWork && <button className="btn btn-danger" onClick={cancelProject}>Cancel project</button>}
            {canDelete && <button className="btn btn-ghost" onClick={deleteProject}>Delete project</button>}
          </div>
        )}
        {role === 'viewer' && <p className="muted small">You are viewing this project read-only.</p>}
      </div>

      <h2>Milestones</h2>
      {project.milestones.length === 0 && <p className="muted">No milestones yet.</p>}
      <div className="stack">
        {project.milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            role={role}
            onAction={handleAction}
            onDelete={handleDeleteMilestone}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

      {role === 'client' && isOpenForWork && <MilestoneForm onSubmit={handleAddMilestone} />}
    </div>
  );
}
