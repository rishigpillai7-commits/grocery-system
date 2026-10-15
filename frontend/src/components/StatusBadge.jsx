import { label } from '../utils/format';

// Reusable presentational component: <StatusBadge status="funded" />
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{label(status)}</span>;
}
