import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Building2, Users2, Shield, Lock, DollarSign, FileText, LogOut, UserCheck } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, permissions, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <div>
          <h1>RBAC System</h1>
          <div className="sidebar-email">{user?.email}</div>
        </div>
        
        <nav style={{ flex: 1 }}>
          <Link to="/users" className={`nav-link ${location.pathname === '/users' ? 'active' : ''}`}>
            <Users size={18} />
            Users
          </Link>
          
          <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
            <Building2 size={18} />
            Teams
          </Link>
          
          <Link to="/groups" className={`nav-link ${location.pathname === '/groups' ? 'active' : ''}`}>
            <Users2 size={18} />
            Groups
          </Link>
          
          <Link to="/roles" className={`nav-link ${location.pathname === '/roles' ? 'active' : ''}`}>
            <Shield size={18} />
            Roles
          </Link>

          <div className="nav-divider" />
          
          {permissions?.vault?.length && (
            <Link to="/vault" className={`nav-link ${location.pathname === '/vault' ? 'active' : ''}`}>
              <Lock size={18} />
              Vault
            </Link>
          )}
          
          {permissions?.financials?.length && (
            <Link to="/financials" className={`nav-link ${location.pathname === '/financials' ? 'active' : ''}`}>
              <DollarSign size={18} />
              Financials
            </Link>
          )}
          
          {permissions?.reporting?.length && (
            <Link to="/reporting" className={`nav-link ${location.pathname === '/reporting' ? 'active' : ''}`}>
              <FileText size={18} />
              Reporting
            </Link>
          )}

          <div className="nav-divider" />
          
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <UserCheck size={18} />
            Admin
          </Link>
        </nav>

        <button onClick={handleLogout} className="nav-link">
          <LogOut size={18} />
          Logout
        </button>
      </div>
      
      <main className="main">
        {children}
      </main>
    </div>
  );
}