import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if session expired
  const sessionExpired = new URLSearchParams(location.search).get('sessionExpired') === 'true';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Left Column: Premium Brand & Security Visual */}
      <div
        className="auth-brand-col"
        style={{
          flex: '1 1 50%',
          backgroundColor: '#0F172A',
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.25) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(30, 58, 138, 0.4) 0%, transparent 60%)',
          color: '#FFFFFF',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldCheck size={24} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em' }}>
            TRUSTPAY
          </span>
        </div>

        {/* Center Hero Content */}
        <div style={{ maxWidth: '480px', margin: '40px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              marginBottom: '20px',
            }}
          >
            <Cpu size={14} />
            <span>AI-POWERED FRAUD SENTINEL</span>
          </div>

          <h1
            style={{
              fontSize: '36px',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Smarter transactions.<br />Safer banking.
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            Real-time transaction monitoring and intelligent risk analysis detecting suspicious patterns before fraud occurs.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E2E8F0', fontSize: '14px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              Sub-millisecond ML risk scoring with LightGBM
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E2E8F0', fontSize: '14px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              Adaptive device fingerprinting and geolocation verification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#E2E8F0', fontSize: '14px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              Automated high-risk alerting & rapid admin review workflows
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={14} />
          <span>Enterprise-grade end-to-end encryption & ISO 27001 standards</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
          }}
        >
          {sessionExpired && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                color: 'var(--color-warning)',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              Sign In
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Enter your credentials to access your TrustPay account.
            </p>
          </div>

          {errorMsg && (
            <div
              className="animate-fade-in"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger)',
                fontSize: '13px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldAlert size={16} flexShrink={0} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMsg('Please contact system administrator for password recovery.');
                  }}
                  style={{ fontSize: '12px', color: 'var(--primary)' }}
                >
                  Forgot password?
                </a>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .auth-brand-col {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
