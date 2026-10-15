import { memo } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, formatMoney } from '../utils/format';

// memo(): re-renders only when its `project` prop changes.
function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="card project-card">
      <div className="card-head">
        <h3>{project.title}</h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="muted clamp">{project.description || 'No description'}</p>
      <dl className="meta">
        <div><dt>Budget</dt><dd>{formatMoney(project.budget)}</dd></div>
        <div><dt>Deadline</dt><dd>{formatDate(project.deadline)}</dd></div>
        <div><dt>Client</dt><dd>{project.client ? project.client.name : '—'}</dd></div>
        <div><dt>Freelancer</dt><dd>{project.freelancer ? project.freelancer.name : 'Not assigned'}</dd></div>
      </dl>
    </Link>
  );
}

export default memo(ProjectCard);
