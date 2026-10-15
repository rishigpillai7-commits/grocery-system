import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function Navbar() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">🔒 FreelanceEscrow</span>
        {user && (
          <nav className="nav-links">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/projects" end>Projects</NavLink>
            {user.role === 'client' && <NavLink to="/projects/new">New project</NavLink>}
            <NavLink to="/ledger">Ledger</NavLink>
            <NavLink to="/people">People</NavLink>
          </nav>
        )}
        {user && (
          <div className="session">
            <span className="session-name">
              {user.name} <small>({user.role})</small>
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}
