import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

// Global state (useReducer + useContext): the signed-in "session" and toast messages.
const AppContext = createContext(null);
const STORAGE_KEY = 'escrow-session';

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

const initialState = () => ({ user: readSession(), toast: null });

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.user };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'TOAST':
      return { ...state, toast: { id: Date.now(), message: action.message, kind: action.kind } };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Keep the session across page reloads.
  useEffect(() => {
    try {
      if (state.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable: ignore */
    }
  }, [state.user]);

  const login = useCallback((user) => dispatch({ type: 'LOGIN', user }), []);
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const notify = useCallback((message, kind = 'success') => dispatch({ type: 'TOAST', message, kind }), []);
  const clearToast = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), []);

  const value = useMemo(
    () => ({ user: state.user, toast: state.toast, login, logout, notify, clearToast }),
    [state.user, state.toast, login, logout, notify, clearToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
