import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';
import StateMessage from '../components/StateMessage.jsx';

// Demo "session": pick who you are acting as. The choice is stored in global state (context + reducer).
export default function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState('client');
  const [personId, setPersonId] = useState('');
  const { data: people, loading, error, reload } = useFetch(role === 'client' ? '/clients' : '/freelancers');

  useEffect(() => {
    setPersonId('');
  }, [role]);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    const person = (people || []).find((p) => String(p.id) === String(personId));
    if (!person) return;
    login({ role, id: person.id, name: person.name });
    navigate('/');
  };

  return (
    <div className="center-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Sign in</h1>
        <p className="muted">Choose who you want to act as. Clients fund and release escrow; freelancers submit work.</p>

        <div className="segmented">
          <button type="button" className={role === 'client' ? 'active' : ''} onClick={() => setRole('client')}>
            I am a Client
          </button>
          <button type="button" className={role === 'freelancer' ? 'active' : ''} onClick={() => setRole('freelancer')}>
            I am a Freelancer
          </button>
        </div>

        <StateMessage loading={loading} error={error} onRetry={reload} />

        {!loading && !error && (
          <>
            <label>
              {role === 'client' ? 'Client' : 'Freelancer'}
              <select value={personId} onChange={(e) => setPersonId(e.target.value)} required>
                <option value="">Select…</option>
                {(people || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            {(people || []).length === 0 && (
              <p className="muted small">Nobody here yet — run <code>npm run seed</code> in the backend.</p>
            )}
            <button className="btn btn-primary" type="submit" disabled={!personId}>Continue</button>
          </>
        )}
      </form>
    </div>
  );
}
