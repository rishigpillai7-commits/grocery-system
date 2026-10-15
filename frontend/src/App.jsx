import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ledger from './pages/Ledger.jsx';
import Login from './pages/Login.jsx';
import NewProject from './pages/NewProject.jsx';
import NotFound from './pages/NotFound.jsx';
import People from './pages/People.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import Projects from './pages/Projects.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Everything inside needs a signed-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/people" element={<People />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toast />
    </>
  );
}
