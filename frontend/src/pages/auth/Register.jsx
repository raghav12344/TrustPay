import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Lock, Mail, User, Phone, Eye, EyeOff, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 33, text: 'Weak', color: '#DC2626' };
    if (score <= 3) return { score: 66, text: 'Moderate', color: '#D97706' };
    return { score: 100, text: 'Strong', color: '#16A34A' };
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      success('Account created successfully! Please sign in with your credentials.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
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
      {/* Left Column: Brand & Security Visual */}
      <div
        className="auth-brand-col"
        style={{
          flex: '1 1 45%',
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

        <div style={{ maxWidth: '460px', margin: '40px 0' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}
          >
            Join the new era of protected digital finance.
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            Every transaction is safeguarded by machine learning telemetry, device authentication, and adaptive security algorithms.
          </p>

          <div
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#93C5FD', marginBottom: '4px' }}>
              ✓ Instant Account Creation
            </div>
            <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
              Your dedicated savings account and fraud monitoring telemetry are provisioned instantly upon signup.
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={14} />
          <span>Compliant with modern RBI cybersecurity guidelines</span>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div
        style={{
          flex: '1 1 55%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              Create Account
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Open your secure TrustPay savings account in seconds.
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
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
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
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Arjun Mehta"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
                  name="email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="arjun@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
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
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password (min. 6 characters)
              </label>
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
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

              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      height: '4px',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${strength.score}%`,
                        height: '100%',
                        backgroundColor: strength.color,
                        transition: 'all 300ms ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: strength.color, marginTop: '4px', fontWeight: 600 }}>
                    {strength.text} password
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '12px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Sign In
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

export default Register;
