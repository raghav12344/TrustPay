import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Cpu,
  Sun,
  Moon,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState('CUSTOMER');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if session expired
  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired') === 'true';

  const handleDemoFill = (role) => {
    setActiveRoleTab(role);
    if (role === 'ADMIN') {
      setEmail('admin@trustpay.com');
      setPassword('admin123');
    } else {
      setEmail('rohan@example.com');
      setPassword('password123');
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const data = await login(email.trim(), password);

      success(`Welcome back, ${data.user?.name || 'User'}!`);

      if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Left Column: Apple Obsidian Showcase */}
      <div
        className="hidden lg:flex lg:w-1/2 p-14 flex-col justify-between relative overflow-hidden select-none"
        style={{
          background: 'radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.18) 0%, transparent 55%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.22) 0%, transparent 60%), #040711',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              TRUST<span className="text-cyan-400">PAY</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
          >
            <ArrowLeft size={14} />
            <span>Back to Showcase</span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="max-w-md my-auto relative z-10 py-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-400 text-xs font-mono font-semibold tracking-wider mb-6">
            <Cpu size={14} />
            <span>SENTINEL AI CLOUD DEFENSE</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Next-generation banking.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Protected by dual AI.
            </span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Experience non-blocking event-driven transactions backed by LightGBM anomaly scoring,
            Groq LPU forensic reasoning, and an immutable BCNF MySQL ledger.
          </p>

          {/* Quick Feature Checklist */}
          <div className="space-y-3.5 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Sub-2ms median LightGBM tree classification</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>RabbitMQ asynchronous queue decoupling (<span className="text-blue-300 font-mono">202 Accepted</span>)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Redis 7 sliding-window rate limiting &amp; caching</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Row-level locking (<span className="text-purple-300 font-mono">FOR UPDATE</span>) ACID consistency</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-6 border-t border-white/10 relative z-10">
          <span>TLS 1.3 • AES-256 • BCNF MySQL 8</span>
          <span className="text-cyan-400 font-semibold">MNNIT CSE • Section E2</span>
        </div>
      </div>

      {/* Right Column: Apple-Grade Glass Sign In Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        
        {/* Mobile Top Navigation & Theme Toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            aria-label="Toggle dark/light mode"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        <div className="w-full max-w-md">
          
          {/* Mobile Brand Link */}
          <div className="lg:hidden mb-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <ShieldCheck size={18} />
              </div>
              <span className="font-extrabold text-lg tracking-tight">TRUSTPAY</span>
            </Link>

            <Link to="/" className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1">
              <ArrowLeft size={13} />
              <span>Back</span>
            </Link>
          </div>

          {sessionExpired && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium mb-6 flex items-center gap-2.5">
              <ShieldAlert size={16} className="shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
              Sign in to TrustPay
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Select your role or enter credentials to access your banking account.
            </p>
          </div>

          {/* Role Switcher & Demo Auto-Fill Tabs */}
          <div className="p-1 rounded-2xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] grid grid-cols-2 gap-1 mb-6">
            <button
              type="button"
              onClick={() => handleDemoFill('CUSTOMER')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRoleTab === 'CUSTOMER'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserCheck size={14} />
              <span>Demo Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('ADMIN')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRoleTab === 'ADMIN'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Demo Admin</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium mb-6 flex items-center gap-2.5 animate-fade-in">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  className="form-input pl-10"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label mb-0" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setErrorMsg('Demo accounts use default seeded passwords.')}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-apple-primary w-full py-3.5 font-bold text-sm shadow-lg mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center text-sm text-[var(--text-secondary)]">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[var(--primary)] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
