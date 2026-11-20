import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Send,
  Receipt,
  User,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Users,
  BarChart3,
  Wallet,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = role === 'ADMIN';

  const customerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/make-transaction', label: 'Make Transaction', icon: Send },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/fraud-alerts', label: 'Fraud Alerts', icon: ShieldAlert },
    { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
    { to: '/admin/accounts', label: 'Accounts & Balance', icon: Wallet },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : customerLinks;

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform var(--transition-smooth)',
          flexShrink: 0,
        }}
        className={`sidebar ${isOpen ? 'open' : ''}`}
        aria-label="Navigation sidebar"
      >
        {/* Logo and Brand */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              }}
            >
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                TRUSTPAY
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isAdmin ? 'var(--color-danger)' : 'var(--primary)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {isAdmin ? 'Sentinel Admin' : 'Secure Banking'}
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'none',
              padding: '4px',
            }}
            aria-label="Close navigation sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{ padding: '20px 14px', flex: 1, overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '0 12px 10px',
              letterSpacing: '0.05em',
            }}
          >
            {isAdmin ? 'Risk & Operations' : 'Main Menu'}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => onClose && onClose()}
                  end={link.to === '/dashboard' || link.to === '/admin'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                  })}
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-color)',
              margin: '20px 10px',
            }}
          />

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '0 12px 10px',
              letterSpacing: '0.05em',
            }}
          >
            Account
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavLink
              to="/profile"
              onClick={() => onClose && onClose()}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none',
              })}
            >
              <User size={18} strokeWidth={2} />
              <span>Profile & Security</span>
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-danger)',
                backgroundColor: 'transparent',
                border: 'none',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={18} strokeWidth={2} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* Security Indicator Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                boxShadow: '0 0 8px rgba(22, 163, 74, 0.6)',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}
            >
              {isAdmin ? 'Sentinel AI Active' : 'Account protected'}
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            256-bit TLS • Real-time ML
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            box-shadow: var(--shadow-xl);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
