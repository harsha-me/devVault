import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Inbox, CalendarDays, Code2, LogOut, User, FolderKanban, Menu, X } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  path: '/dashboard' },
  { icon: FileText,        label: 'My Notes',   path: '/previous-notes' },
  { icon: FolderKanban,    label: 'Workspaces', path: '/workspaces' },
  { icon: Inbox,           label: 'Inbox',      path: '/received-notes' },
  { icon: CalendarDays,    label: 'Calendar',   path: '/calendar' },
  { icon: Code2,           label: 'Compiler',   path: '/compiler' },
  { icon: User,            label: 'Profile',    path: '/profile' },
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const mobileNavBtn = (path, Icon, label, isLogout = false) => {
    const isActive  = location.pathname === path;
    let bg    = 'transparent';
    let color = 'var(--stone-600)';

    if (isActive) { bg = 'var(--accent-light)'; color = 'var(--accent)'; }

    return (
      <button
        key={isLogout ? 'logout' : path}
        onClick={isLogout ? () => { handleLogout(); setDrawerOpen(false); } : () => { navigate(path); setDrawerOpen(false); }}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: bg,
          color,
          fontSize: '0.9rem',
          fontWeight: isActive ? 700 : 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: 'all 0.18s ease',
          textAlign: 'left',
        }}
      >
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{label}</span>
        {label === 'Inbox' && unreadCount > 0 && (
          <span style={{
            background: '#E8745A',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
          }}>
            {unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex" style={{
        width: 72, minWidth: 72,
        height: '100vh',
        position: 'fixed', left: 0, top: 0,
        background: 'var(--cream)',
        borderRight: '1px solid var(--stone-200)',
        flexDirection: 'column',
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

      {/* Mobile Top Navbar */}
      <header className="flex md:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'var(--cream)', borderBottom: '1px solid var(--stone-200)',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem', zIndex: 99,
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--stone-700)', padding: 6, display: 'flex', alignItems: 'center',
            borderRadius: 8,
          }}
        >
          <Menu size={22} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <span style={{
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #E8E3FF, #D8D2FF)',
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: '0 1px 6px rgba(124,111,247,0.15)',
            fontWeight: 'bold',
          }}>✦</span>
          <span style={{ fontWeight: 800, color: 'var(--stone-900)', fontSize: '1rem', letterSpacing: '-0.015em' }}>DevVault</span>
        </div>

        <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {unreadCount > 0 && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#E8745A',
              border: '1.5px solid var(--cream)',
            }} />
          )}
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(42,37,32,0.35)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
              animation: 'dvFadeIn 0.2s ease both',
            }}
          />
          {/* Drawer body */}
          <aside
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 270,
              background: 'var(--cream)', borderRight: '1px solid var(--stone-200)',
              display: 'flex', flexDirection: 'column',
              padding: '1.5rem 1.25rem', zIndex: 1000,
              boxShadow: '4px 0 24px rgba(42,37,32,0.1)',
              animation: 'dvSlideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #E8E3FF, #D8D2FF)',
                  width: 32, height: 32, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)',
                  fontWeight: 'bold',
                }}>✦</span>
                <span style={{ fontWeight: 800, color: 'var(--stone-900)', fontSize: '1.1rem', letterSpacing: '-0.015em' }}>DevVault</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--stone-400)', padding: 6, display: 'flex', alignItems: 'center',
                  borderRadius: 8,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {navItems.map(({ icon, label, path }) =>
                mobileNavBtn(path, icon, label)
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--stone-200)', margin: '1rem 0' }} />

            {/* Logout */}
            {mobileNavBtn('', LogOut, 'Logout', true)}
          </aside>
        </>
      )}
    </>
  );
}

export default Sidebar;
