import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon } from 'lucide-react';

export const Navbar = ({ onOpenSidebar, title = 'TrustPay' }) => {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name) => {
    if (!name) return 'TP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isAdmin = role === 'ADMIN';

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onOpenSidebar}
          className="btn-ghost menu-toggle-btn"
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-ghost"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 10px 6px 6px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isAdmin ? 'var(--color-danger)' : 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {getInitials(user?.name)}
          </div>

          <div className="user-name-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {user?.name || 'User'}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isAdmin ? 'var(--color-danger)' : 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {role || 'CUSTOMER'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .menu-toggle-btn {
            display: flex !important;
          }
        }
        @media (max-width: 520px) {
          .user-name-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
