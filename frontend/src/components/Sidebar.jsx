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
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = role === 'ADMIN';

  const customerLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/make-transaction', label: 'Make Transfer', icon: Send },
    { to: '/transactions', label: 'Transaction Ledger', icon: Receipt },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Triage Overview', icon: LayoutDashboard },
    { to: '/admin/fraud-alerts', label: 'Fraud Alerts Queue', icon: ShieldAlert },
    { to: '/admin/transactions', label: 'Global Ledger', icon: Receipt },
    { to: '/admin/accounts', label: 'Accounts & Liquidity', icon: Wallet },
    { to: '/admin/customers', label: 'Customer Directory', icon: Users },
    { to: '/admin/analytics', label: 'Risk Analytics', icon: BarChart3 },
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
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside Panel */}
      <aside
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderRight: '1px solid var(--border-color)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        aria-label="Navigation sidebar"
      >
        {/* Top Logo & Brand Area */}
        <div
          style={{
            height: '68px',
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <NavLink
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isAdmin
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #0071E3 0%, #4338ca 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: isAdmin
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(0, 113, 227, 0.3)',
              }}
            >
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                TRUST<span style={{ color: isAdmin ? '#ef4444' : 'var(--primary)' }}>PAY</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {isAdmin ? 'Security Console' : 'Personal Banking'}
              </span>
            </div>
          </NavLink>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="mobile-sidebar-close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div
          style={{
            flex: 1,
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0 12px',
                marginBottom: '8px',
              }}
            >
              {isAdmin ? 'Surveillance Mesh' : 'Financial Services'}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      textDecoration: 'none',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--bg-card-subtle)' : 'transparent',
                      border: isActive
                        ? '1px solid var(--border-color)'
                        : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={17} strokeWidth={2} />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight size={13} style={{ opacity: 0.4 }} />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                padding: '0 12px',
                marginBottom: '8px',
              }}
            >
              Account & Security
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink
                to="/profile"
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-card-subtle)' : 'transparent',
                  border: isActive
                    ? '1px solid var(--border-color)'
                    : '1px solid transparent',
                })}
              >
                <User size={17} />
                <span>Profile & Device UUID</span>
              </NavLink>

              <NavLink
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                }}
              >
                <ExternalLink size={16} />
                <span>Public Showcase</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Bottom Profile Drawer & Sign Out */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
                color: 'var(--text-primary)',
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TP'}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name || 'Authorized User'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email || 'user@trustpay.internal'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'color 0.15s ease',
            }}
            title="Sign out of account"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
