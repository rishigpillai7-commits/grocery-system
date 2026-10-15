import { memo } from 'react';
import StatusBadge from './StatusBadge.jsx';
import TaskList from './TaskList.jsx';
import { formatDate, formatMoney } from '../utils/format';

// Which escrow buttons each role may press for each milestone status.
const ACTIONS = {
  client: {
    pending: [{ action: 'fund', text: 'Fund escrow', primary: true }],
    funded: [{ action: 'refund', text: 'Refund', danger: true }],
    submitted: [
      { action: 'release', text: 'Release payment', primary: true },
      { action: 'dispute', text: 'Dispute', danger: true },
    ],
    disputed: [{ action: 'refund', text: 'Refund', danger: true }],
  },
  freelancer: {
    funded: [
      { action: 'submit', text: 'Submit work', primary: true },
      { action: 'dispute', text: 'Dispute', danger: true },
    ],
    submitted: [{ action: 'dispute', text: 'Dispute', danger: true }],
  },
};

function MilestoneCard({ milestone, role, onAction, onDelete, onToggleTask, onAddTask, onDeleteTask }) {
  const buttons = (ACTIONS[role] && ACTIONS[role][milestone.status]) || [];
  const settled = ['released', 'refunded'].includes(milestone.status);

  return (
    <div className="card milestone">
      <div className="card-head">
        <div>
          <h4>{milestone.title}</h4>
          <span className="muted small">Due {formatDate(milestone.dueDate)}</span>
        </div>
        <div className="right">
          <strong>{formatMoney(milestone.amount)}</strong>
          <StatusBadge status={milestone.status} />
        </div>
      </div>

      <TaskList
        milestoneId={milestone.id}
        tasks={milestone.tasks || []}
        locked={settled}
        onToggle={onToggleTask}
        onAdd={onAddTask}
        onDelete={onDeleteTask}
      />

      {(buttons.length > 0 || (role === 'client' && milestone.status === 'pending')) && (
        <div className="actions">
          {buttons.map((b) => (
            <button
              key={b.action}
              className={`btn ${b.primary ? 'btn-primary' : ''} ${b.danger ? 'btn-danger' : ''}`}
              onClick={() => onAction(milestone.id, b.action)}
            >
              {b.text}
            </button>
          ))}
          {role === 'client' && milestone.status === 'pending' && (
            <button className="btn btn-ghost" onClick={() => onDelete(milestone.id)}>Delete</button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MilestoneCard);
