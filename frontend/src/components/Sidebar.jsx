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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col border-r transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderColor: 'var(--border-color)',
        }}
        aria-label="Navigation sidebar"
      >
        {/* Top Logo & Brand Area */}
        <div className="h-17 px-6 flex items-center justify-between border-b border-[var(--border-color)]">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-105 ${
                isAdmin
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
              }`}
            >
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                TRUST<span className={isAdmin ? 'text-rose-500' : 'text-[var(--primary)]'}>PAY</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                {isAdmin ? 'Sentinel Cockpit' : 'Personal Banking'}
              </span>
            </div>
          </NavLink>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links Area */}
        <div className="flex-1 px-3.5 py-6 overflow-y-auto space-y-6">
          
          <div>
            <div className="px-3 mb-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {isAdmin ? 'Surveillance & Ops' : 'Financial Services'}
            </div>

            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => onClose && onClose()}
                    end={link.to === '/dashboard' || link.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-500/20'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
                          <span>{link.label}</span>
                        </div>
                        {isActive && <ChevronRight size={14} className="opacity-80" />}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 mb-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Account & Security
            </div>

            <nav className="space-y-1">
              <NavLink
                to="/profile"
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)]'
                  }`
                }
              >
                <User size={17} />
                <span>Profile &amp; Device UUID</span>
              </NavLink>

              <NavLink
                to="/"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink size={16} />
                  <span>Public Showcase</span>
                </div>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Bottom User Profile & Sign Out Bar */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="p-3 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  isAdmin ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                {(user?.name || 'TP').slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {user?.name || 'Logged In'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {user?.email || 'authenticated'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
