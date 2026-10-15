// Thin fetch wrapper around the ISA-II Express API.
// In dev, "/api" is proxied to http://localhost:5000 (see vite.config.js).
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = (data && data.error) || `Request failed (${res.status})`;
    if (data && Array.isArray(data.details) && data.details.length) {
      message = data.details.map((d) => d.message).join('. ');
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  del: (path) => request('DELETE', path),
};
