import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, ShieldCheck, ShieldAlert } from 'lucide-react';

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
      className="sticky top-0 z-30 h-17 px-6 flex items-center justify-between border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="btn-ghost p-2 rounded-xl border border-[var(--border-color)] flex lg:hidden items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={19} />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200"
          style={{
            backgroundColor: 'var(--bg-card-subtle)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Pill */}
        <div
          className="flex items-center gap-2.5 py-1 px-2.5 rounded-full border shadow-sm transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-br from-rose-500 to-red-600'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}
          >
            {getInitials(user?.name)}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              {user?.name || 'User'}
            </span>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                isAdmin ? 'text-rose-500' : 'text-[var(--primary)]'
              }`}
            >
              {role || 'CUSTOMER'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
