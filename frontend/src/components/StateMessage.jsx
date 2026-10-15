// Shows a loading / error / empty message so pages don't repeat this markup.
export default function StateMessage({ loading, error, onRetry }) {
  if (loading) return <p className="state">Loading…</p>;
  if (error) {
    return (
      <div className="state state-error">
        <p>⚠ {error}</p>
        <p className="muted">Is the backend running on port 5000?</p>
        {onRetry && <button className="btn" onClick={onRetry}>Retry</button>}
      </div>
    );
  }
  return null;
}
