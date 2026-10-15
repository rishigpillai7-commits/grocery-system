const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

// MySQL returns DECIMAL columns as strings, so always convert first.
export const formatMoney = (value) => inr.format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const label = (status) => String(status || '').replace('_', ' ');
