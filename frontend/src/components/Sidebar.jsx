import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Inbox, CalendarDays, Code2, LogOut } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
  { icon: FileText,        label: 'My Notes',   path: '/previous-notes' },
  { icon: Inbox,           label: 'Inbox',      path: '/received-notes' },
  { icon: CalendarDays,    label: 'Calendar',   path: '/calendar' },
  { icon: Code2,           label: 'Compiler',   path: '/compiler' },
];

const Tooltip = ({ label }) => (
  <div style={{
    position: 'absolute', left: 56, top: '50%',
    transform: 'translateY(-50%)',
    background: 'var(--stone-900)', color: '#fff',
    padding: '5px 12px', borderRadius: 9,
    fontSize: '0.75rem', fontWeight: 600,
    whiteSpace: 'nowrap', zIndex: 9999,
    boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    pointerEvents: 'none',
    letterSpacing: '0.01em',
  }}>
    {label}
    {/* arrow */}
    <span style={{
      position: 'absolute', right: '100%', top: '50%',
      transform: 'translateY(-50%)',
      border: '5px solid transparent',
      borderRightColor: 'var(--stone-900)',
    }} />
  </div>
);

function Sidebar({ unreadCount = 0 }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const navBtn = (path, Icon, label, isLogout = false) => {
    const isActive  = location.pathname === path;
    const isHovered = hovered === (isLogout ? 'logout' : path);

    let bg    = 'transparent';
    let color = 'var(--stone-400)';

    if (isActive)        { bg = 'var(--accent-light)'; color = 'var(--accent)'; }
    else if (isHovered) {
      bg    = isLogout ? 'var(--danger-light)' : 'var(--stone-100)';
      color = isLogout ? 'var(--danger)'       : 'var(--stone-700)';
    }

    return (
      <div
        key={isLogout ? 'logout' : path}
        style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(isLogout ? 'logout' : path)}
        onMouseLeave={() => setHovered(null)}
      >
        <button
          onClick={isLogout ? handleLogout : () => navigate(path)}
          style={{
            width: 44, height: 44, borderRadius: 13,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: bg, color,
            transition: 'background 0.18s ease, color 0.18s ease',
            position: 'relative',
          }}
        >
          <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
          {/* unread dot */}
          {label === 'Inbox' && unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 9, right: 9,
              width: 7, height: 7, borderRadius: '50%',
              background: '#E8745A',
              border: '1.5px solid var(--cream)',
            }} />
          )}
        </button>
        {isHovered && <Tooltip label={isLogout ? 'Logout' : label} />}
      </div>
    );
  };

  return (
    <aside style={{
      width: 72, minWidth: 72,
      height: '100vh',
      position: 'fixed', left: 0, top: 0,
      background: 'var(--cream)',
      borderRight: '1px solid var(--stone-200)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '1.25rem 0',
      zIndex: 100,
      gap: 0,
    }}>

      {/* Logo mark */}
      <button
        onClick={() => navigate('/dashboard')}
        onMouseEnter={() => setHovered('logo')}
        onMouseLeave={() => setHovered(null)}
        style={{
          width: 42, height: 42, borderRadius: 13,
          background: hovered === 'logo'
            ? 'linear-gradient(135deg, #DDD8FF, #C8C2FF)'
            : 'linear-gradient(135deg, #E8E3FF, #D8D2FF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.125rem', color: 'var(--accent)',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(124,111,247,0.2)',
          transition: 'all 0.2s ease',
          transform: hovered === 'logo' ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        ✦
      </button>

      {/* Nav links */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
        {navItems.map(({ icon, label, path }) =>
          navBtn(path, icon, label)
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 32, height: 1, background: 'var(--stone-200)', margin: '0.75rem 0' }} />

      {/* Logout */}
      {navBtn('', LogOut, 'Logout', true)}
    </aside>
  );
}

export default Sidebar;
