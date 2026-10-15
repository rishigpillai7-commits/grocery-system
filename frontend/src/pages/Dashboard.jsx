import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';
import StateMessage from '../components/StateMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const { user } = useApp();
  const scope = user.role === 'client' ? `clientId=${user.id}` : `freelancerId=${user.id}`;

  // Both endpoints are RAW SQL reports on the backend.
  const summary = useFetch(`/reports/escrow-summary?${scope}`);
  const earnings = useFetch('/reports/freelancer-earnings');

  const activeCount = useMemo(
    () => (summary.data ? summary.data.projects.filter((p) => p.status === 'in_progress').length : 0),
    [summary.data]
  );

  const totals = summary.data ? summary.data.totals : null;

  return (
    <div className="page">
      <h1>Welcome, {user.name}</h1>
      <p className="muted">
        {user.role === 'client'
          ? 'Money you have placed in escrow and paid out across your projects.'
          : 'Escrow protecting the work you have been hired for.'}
      </p>

      <StateMessage loading={summary.loading && !summary.data} error={summary.error} onRetry={summary.reload} />

      {totals && (
        <>
          <div className="stats">
            <div className="stat"><span>Total budget</span><strong>{formatMoney(totals.budget)}</strong></div>
            <div className="stat accent"><span>Held in escrow</span><strong>{formatMoney(totals.inEscrow)}</strong></div>
            <div className="stat good"><span>Released</span><strong>{formatMoney(totals.released)}</strong></div>
            <div className="stat"><span>Not yet funded</span><strong>{formatMoney(totals.unfunded)}</strong></div>
            <div className="stat"><span>Active projects</span><strong>{activeCount}</strong></div>
          </div>

          <h2>Your projects</h2>
          {summary.data.projects.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project</th><th>Status</th><th>Budget</th><th>In escrow</th><th>Released</th><th>Unfunded</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.projects.map((p) => (
                    <tr key={p.id}>
                      <td><Link to={`/projects/${p.id}`}>{p.title}</Link></td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{formatMoney(p.budget)}</td>
                      <td>{formatMoney(p.inEscrow)}</td>
                      <td>{formatMoney(p.released)}</td>
                      <td>{formatMoney(p.unfunded)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h2>Top freelancers by earnings</h2>
      <StateMessage loading={earnings.loading && !earnings.data} error={earnings.error} onRetry={earnings.reload} />
      {earnings.data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Freelancer</th><th>Skills</th><th>Projects</th><th>Earned</th><th>In escrow</th></tr>
            </thead>
            <tbody>
              {earnings.data.map((f, i) => (
                <tr key={f.id}>
                  <td>{i + 1}</td>
                  <td>{f.name}</td>
                  <td className="muted">{f.skills || '—'}</td>
                  <td>{f.projectCount}</td>
                  <td>{formatMoney(f.totalEarned)}</td>
                  <td>{formatMoney(f.inEscrow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
