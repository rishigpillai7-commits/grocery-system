import { useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext.jsx';
import useFetch from '../hooks/useFetch';
import StateMessage from '../components/StateMessage.jsx';
import { formatMoney } from '../utils/format';

const EMPTY = { name: '', email: '', company: '', skills: '', hourlyRate: '' };

// Lists clients / freelancers and lets you add new ones (POST) or remove them (DELETE).
export default function People() {
  const { notify } = useApp();
  const [tab, setTab] = useState('clients');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useFetch(`/${tab}`);

  const isClients = tab === 'clients';
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const switchTab = (next) => {
    setTab(next);
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = isClients
        ? { name: form.name, email: form.email, company: form.company || null }
        : {
            name: form.name,
            email: form.email,
            skills: form.skills || null,
            hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          };
      await api.post(`/${tab}`, body);
      notify(isClients ? 'Client added' : 'Freelancer added');
      setForm(EMPTY);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (person) => {
    if (!window.confirm(`Delete ${person.name}?`)) return;
    try {
      await api.del(`/${tab}/${person.id}`);
      notify('Deleted');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="page">
      <h1>People</h1>
      <div className="segmented">
        <button className={isClients ? 'active' : ''} onClick={() => switchTab('clients')}>Clients</button>
        <button className={!isClients ? 'active' : ''} onClick={() => switchTab('freelancers')}>Freelancers</button>
      </div>

      <form className="card form" onSubmit={submit}>
        <h4>Add {isClients ? 'a client' : 'a freelancer'}</h4>
        <div className="row">
          <label>Name<input name="name" value={form.name} onChange={change} required minLength={2} /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={change} required /></label>
          {isClients ? (
            <label>Company<input name="company" value={form.company} onChange={change} /></label>
          ) : (
            <>
              <label>Skills<input name="skills" value={form.skills} onChange={change} placeholder="React, Node.js" /></label>
              <label>Hourly rate (₹)<input name="hourlyRate" type="number" min="0" value={form.hourlyRate} onChange={change} /></label>
            </>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add'}</button>
      </form>

      <StateMessage loading={loading && !data} error={error} onRetry={reload} />
      {data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th>
                {isClients ? <th>Company</th> : <><th>Skills</th><th>Rate</th></>}
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  {isClients ? (
                    <td>{p.company || '—'}</td>
                  ) : (
                    <>
                      <td>{p.skills || '—'}</td>
                      <td>{p.hourlyRate ? `${formatMoney(p.hourlyRate)}/h` : '—'}</td>
                    </>
                  )}
                  <td><button className="link-btn danger" onClick={() => remove(p)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
