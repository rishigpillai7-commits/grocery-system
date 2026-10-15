import { useRef, useState } from 'react';

const INITIAL = { title: '', amount: '', dueDate: '' };

// Controlled form. `onSubmit(values)` must resolve to true when the milestone was saved.
export default function MilestoneForm({ onSubmit }) {
  const [form, setForm] = useState(INITIAL);
  const titleRef = useRef(null);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit({
      title: form.title,
      amount: Number(form.amount),
      dueDate: form.dueDate || null,
    });
    if (ok) {
      setForm(INITIAL);
      titleRef.current?.focus();
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h4>Add a milestone</h4>
      <div className="row">
        <label>
          Title
          <input ref={titleRef} name="title" value={form.title} onChange={change} required minLength={3} />
        </label>
        <label>
          Amount (₹)
          <input name="amount" type="number" min="1" step="0.01" value={form.amount} onChange={change} required />
        </label>
        <label>
          Due date
          <input name="dueDate" type="date" value={form.dueDate} onChange={change} />
        </label>
      </div>
      <button className="btn btn-primary" type="submit">Add milestone</button>
    </form>
  );
}
