import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

// Global notification driven by the reducer in AppContext. Auto-hides after 3.5 s.
export default function Toast() {
  const { toast, clearToast } = useApp();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(clearToast, 3500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.kind}`} role="status" onClick={clearToast}>
      {toast.message}
    </div>
  );
}
