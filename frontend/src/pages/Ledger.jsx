import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import StateMessage from '../components/StateMessage.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatMoney } from '../utils/format';

// Read-only audit trail of every deposit, release and refund.
export default function Ledger() {
  const [type, setType] = useState('');
  const { data, loading, error, reload } = useFetch(`/transactions${type ? `?type=${type}` : ''}`);

  const totals = useMemo(() => {
    const sum = { deposit: 0, release: 0, refund: 0 };
    (data || []).forEach((t) => {
      sum[t.type] += Number(t.amount);
    });
    return sum;
  }, [data]);

  return (
    <div className="page">
      <h1>Escrow ledger</h1>

      <div className="stats">
        <div className="stat"><span>Deposited</span><strong>{formatMoney(totals.deposit)}</strong></div>
        <div className="stat good"><span>Released</span><strong>{formatMoney(totals.release)}</strong></div>
        <div className="stat"><span>Refunded</span><strong>{formatMoney(totals.refund)}</strong></div>
      </div>

      <div className="filters card">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All transactions</option>
          <option value="deposit">Deposits</option>
          <option value="release">Releases</option>
          <option value="refund">Refunds</option>
        </select>
      </div>

      <StateMessage loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>When</th><th>Type</th><th>Project</th><th>Milestone</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={t.type} /></td>
                  <td>
                    {t.milestone && t.milestone.project ? (
                      <Link to={`/projects/${t.milestone.project.id}`}>{t.milestone.project.title}</Link>
                    ) : '—'}
                  </td>
                  <td>{t.milestone ? t.milestone.title : '—'}</td>
                  <td>{formatMoney(t.amount)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="muted">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
