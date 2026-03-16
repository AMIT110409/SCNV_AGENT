import { Plus, Upload, LogOut, MessageSquare, LayoutDashboard, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTimeLabel } from '../utils/helpers';
import '../styles/sidebar.css';

function Sidebar({ authData, onLogout, onUploadClick, collapsed = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname === '/dashboard' ? 'dashboard' : 'chat';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!collapsed && (
          <div className="sidebar__brand-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar__brand">
              <span className="sidebar__brand-akzo">Akzo</span>
              <span className="sidebar__brand-nobel">Nobel</span>
            </div>
            <div className="sidebar__tagline">SCNV Platform</div>
          </div>
        )}
        {collapsed && (
          <div className="sidebar__brand-mini" style={{ fontWeight: 'bold', fontSize: '20px' }}>
            <span style={{ color: 'var(--color-primary)' }}>A</span>
            <span style={{ color: 'var(--color-secondary)' }}>N</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="sidebar__nav">
        <button 
          className={`nav-item ${activePage === 'dashboard' ? 'nav-item--active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`nav-item ${activePage === 'chat' ? 'nav-item--active' : ''}`}
          onClick={() => navigate('/chat')}
        >
          <Compass size={18} />
          <span>Explore Agents</span>
        </button>
      </div>

      {/* Spacer to push footer down */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div className="sidebar__footer">
        {/* User Info */}
        {!collapsed && (
          <div className="sidebar__user-card">
            <div className="sidebar__user-email">{authData?.email || 'User'}</div>
            <div className="sidebar__user-role">{authData?.role || 'Guest'}</div>
          </div>
        )}

        {/* Logout */}
        <button className="btn btn-outline btn-full" onClick={onLogout} title="Logout">
          <LogOut size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
