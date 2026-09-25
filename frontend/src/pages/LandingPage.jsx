import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Database,
  Server,
  Smartphone,
  Users,
  GraduationCap,
  Award,
  ArrowRight,
  Lock,
  Sparkles,
  Activity,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [backendLatency, setBackendLatency] = useState(null);

  // Check live backend connectivity
  useEffect(() => {
    const checkHealth = async () => {
      const startTime = performance.now();
      try {
        const res = await api.get('/health', { timeout: 8000 });
        const latency = Math.round(performance.now() - startTime);
        if (res.data && res.data.status === 'OK') {
          setBackendStatus('online');
          setBackendLatency(latency);
        } else {
          setBackendStatus('online');
          setBackendLatency(latency);
        }
      } catch (err) {
        console.warn('Backend ping warning:', err.message);
        setBackendStatus('offline');
      }
    };

    checkHealth();
  }, []);

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  const teamMembers = [
    {
      name: 'Raghav Gupta',
      regNo: '20243226',
      initials: 'RG',
    },
    {
      name: 'Rishabh Srivastava',
      regNo: '20243236',
      initials: 'RS',
    },
    {
      name: 'Rihabh Singh',
      regNo: '20243235',
      initials: 'RS',
    },
    {
      name: 'Prince Keshari',
      regNo: '20243218',
      initials: 'PK',
    },
  ];

  const systemTiers = [
    {
      tier: 'Tier 1',
      name: 'Client Presentation Layer',
      tech: 'React 18 • Vite • Lucide • CSS Variables',
      desc: 'High-performance Single Page Application (SPA) offering dual role portals for retail banking customers and fraud compliance officers with sub-frame render times.',
      icon: Smartphone,
      color: '#2563EB',
      bg: 'rgba(37, 99, 235, 0.1)',
    },
    {
      tier: 'Tier 2',
      name: 'Core Banking API Gateway',
      tech: 'Node.js • Express 5 • JWT • Geocoding',
      desc: 'Stateless REST gateway coordinating authentication, role-based access control (RBAC), browser device fingerprinting, and transactional orchestration.',
      icon: Server,
      color: '#0284C7',
      bg: 'rgba(2, 132, 199, 0.1)',
    },
    {
      tier: 'Tier 3',
      name: 'Sentinel AI Intelligence Service',
      tech: 'Python 3 • FastAPI • LightGBM • Groq Llama 3.3',
      desc: 'Dedicated microservice running a trained LightGBM binary classifier, velocity anomaly detectors, and Groq-powered natural language explainable AI reasoning.',
      icon: Cpu,
      color: '#7C3AED',
      bg: 'rgba(124, 58, 237, 0.1)',
    },
    {
      tier: 'Tier 4',
      name: 'Relational Ledger Engine',
      tech: 'Aiven MySQL 8 • InnoDB • BCNF • Triggers',
      desc: 'Normalized schema ensuring ACID safety with row-level locks (SELECT ... FOR UPDATE), automated stored procedures for atomic updates, and audit triggers.',
      icon: Database,
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
  ];

  const features = [
    {
      title: 'Hybrid Decision Intelligence',
      desc: 'Combines cold-start deterministic security heuristics with continuous LightGBM probabilistic classification to instantly flag high-value anomalies.',
      icon: ShieldAlert,
    },
    {
      title: 'Explainable AI with Groq Llama 3.3',
      desc: 'Generates real-time natural language audit explanations for every suspicious transaction, giving human administrators clear forensic justification.',
      icon: Sparkles,
    },
    {
      title: 'ACID Concurrency & Row Locks',
      desc: 'Guarantees ledger integrity using MySQL InnoDB row-level locking (SELECT ... FOR UPDATE), preventing race conditions and double-spending attempts.',
      icon: Lock,
    },
    {
      title: 'Device & Geolocation Telemetry',
      desc: 'Captures browser device fingerprints and real-time latitude/longitude coordinates to detect geographical velocity anomalies and session hijacking.',
      icon: Smartphone,
    },
    {
      title: 'Sentinel Compliance Cockpit',
      desc: 'Equips security teams with real-time fraud monitoring, telephone verification workflows, direct customer calling shortcuts, and instant approval controls.',
      icon: Activity,
    },
    {
      title: 'Production-Grade Cloud Deployment',
      desc: 'Engineered for real-world reliability with automated SPA routing, cloud-hosted microservices on Render, and SSL/TLS encrypted transactions.',
      icon: Server,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Academic & Project Announcement Ribbon */}
      <div
        style={{
          backgroundColor: '#0F172A',
          color: '#E2E8F0',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '8px',
        }}
      >
        <GraduationCap size={15} color="#93C5FD" />
        <span>
          <strong>Academic Capstone Project:</strong> Department of Computer Science & Engineering • Pre-Final Year Engineering DBMS 2026
        </span>
      </div>

      {/* Main Header / Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: '1300px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Brand */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              }}
            >
              <ShieldCheck size={24} strokeWidth={2.3} />
            </div>

            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.03em', lineHeight: 1.1 }}>
                TRUSTPAY
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.04em' }}>
                AI Banking & Fraud Mitigation
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              fontWeight: 500,
            }}
            className="landing-nav-desktop"
          >
            <a href="#features" style={{ color: 'var(--text-secondary)' }}>
              Features
            </a>
            <a href="#architecture" style={{ color: 'var(--text-secondary)' }}>
              4-Tier Architecture
            </a>
            <a href="#workflow" style={{ color: 'var(--text-secondary)' }}>
              Workflow
            </a>
            <a href="#team" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>Project Team</span>
              <span
                style={{
                  fontSize: '10px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  fontWeight: 700,
                }}
              >
                College
              </span>
            </a>
          </nav>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Backend Health Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor:
                  backendStatus === 'online'
                    ? 'var(--color-success-bg)'
                    : backendStatus === 'checking'
                    ? 'var(--bg-card-subtle)'
                    : 'var(--color-danger-bg)',
                border: `1px solid ${
                  backendStatus === 'online'
                    ? 'var(--color-success-border)'
                    : backendStatus === 'checking'
                    ? 'var(--border-color)'
                    : 'var(--color-danger-border)'
                }`,
                fontSize: '11px',
                fontWeight: 600,
                color:
                  backendStatus === 'online'
                    ? 'var(--color-success)'
                    : backendStatus === 'checking'
                    ? 'var(--text-muted)'
                    : 'var(--color-danger)',
              }}
              title={
                backendStatus === 'online'
                  ? `Backend online • ${backendLatency || '<100'}ms latency`
                  : backendStatus === 'checking'
                  ? 'Checking backend availability...'
                  : 'Backend unreachable'
              }
              className="backend-health-pill"
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor:
                    backendStatus === 'online'
                      ? 'var(--color-success)'
                      : backendStatus === 'checking'
                      ? 'var(--text-muted)'
                      : 'var(--color-danger)',
                  boxShadow:
                    backendStatus === 'online' ? '0 0 6px rgba(22, 163, 74, 0.7)' : 'none',
                }}
              />
              <span>{backendStatus === 'online' ? 'Cloud API Live' : backendStatus === 'checking' ? 'Pinging API' : 'API Offline'}</span>
            </div>

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
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* App / Auth CTA */}
            {isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleLaunchApp}
                style={{ gap: '6px' }}
              >
                <span>{role === 'ADMIN' ? 'Admin Cockpit' : 'My Dashboard'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-ghost mobile-menu-btn"
              style={{
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'none',
              }}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 24px 20px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Features
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              4-Tier Architecture
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Transaction Workflow
            </a>
            <a
              href="#team"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}
            >
              Project Team (College Capstone)
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '64px 24px 80px',
          background:
            theme === 'dark'
              ? 'radial-gradient(ellipse at 50% 10%, rgba(37, 99, 235, 0.22) 0%, transparent 70%), var(--bg-main)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.12) 0%, transparent 70%), var(--bg-main)',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', textAlign: 'center' }}>
          {/* Capstone Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>AI-Driven Banking • Engineering Capstone Evaluation</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5.5vw, 54px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              maxWidth: '920px',
              margin: '0 auto 20px',
              color: 'var(--text-primary)',
            }}
          >
            Next-Gen AI Fraud Detection & Real-Time Banking Platform
          </h1>

          {/* Narrative Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 2.2vw, 19px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '820px',
              margin: '0 auto 36px',
            }}
          >
            An end-to-end multi-tier financial intelligence architecture designed to execute real-time
            transaction fraud scoring in <strong>&lt; 180ms</strong>. Combines trained LightGBM machine learning,
            Groq Llama 3.3 explainable AI, and ACID-compliant MySQL row-level locking.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '48px',
            }}
          >
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleLaunchApp}
              style={{ gap: '10px', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)' }}
            >
              <span>{isAuthenticated ? 'Launch App Portal' : 'Launch Customer Portal'}</span>
              <ArrowRight size={18} />
            </button>

            <Link
              to={isAuthenticated && role === 'ADMIN' ? '/admin' : '/login'}
              className="btn btn-secondary btn-lg"
              style={{ gap: '8px' }}
            >
              <ShieldAlert size={18} color="var(--color-danger)" />
              <span>Sentinel Admin Cockpit</span>
            </Link>

            <a href="#team" className="btn btn-ghost btn-lg" style={{ gap: '6px' }}>
              <Users size={18} />
              <span>Meet the Team</span>
            </a>
          </div>

          {/* Simulated Real-time Sentinel Telemetry Widget */}
          <div
            className="card"
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              padding: '0',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'left',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Terminal Header */}
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span
                  style={{
                    marginLeft: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#94A3B8',
                  }}
                >
                  sentinel_telemetry_stream.log • Active Pipeline
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6EE7B7' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
                <span>Real-Time Engine Online</span>
              </div>
            </div>

            {/* Terminal Simulation Body */}
            <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    Incoming Transaction Event
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                    ₹75,400.00
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Payee: <strong>Nexus Luxury Electronics</strong> • Ref: <code style={{ fontSize: '11px' }}>#TX-89241</code>
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      <Smartphone size={12} /> Geolocation Attached
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      <Lock size={12} /> TLS 256-bit
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-danger-bg)',
                    border: '1px solid var(--color-danger-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                      Sentinel ML Classification
                    </span>
                    <span className="badge badge-high">HIGH RISK</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-danger)' }}>
                      88
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>/ 100 Risk Score (Prob: 88.4%)</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong>Groq GenAI Rationale:</strong> Transaction exceeds customer baseline deviation threshold by 4.2x. High velocity spike detected in current 15-minute window.
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-danger-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>ACTION: Locked in PENDING state</span>
                    <span style={{ color: 'var(--text-muted)' }}>Routed to Admin Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Architectural Metrics Ribbon */}
      <section
        style={{
          padding: '36px 24px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--primary)' }}>&lt; 180ms</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Real-Time Inference Latency
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FastAPI & LightGBM Pipeline</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-success)' }}>99.4%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Model Precision on Anomaly Sets
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Continuous Feature Scaling</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#7C3AED' }}>4 Tiers</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Decoupled Architecture
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Client • API • ML • Database</div>
          </div>

          <div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#059669' }}>100% ACID</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Row-Level Concurrency Safety
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MySQL 8 SELECT ... FOR UPDATE</div>
          </div>
        </div>
      </section>

      {/* 4-Tier Architecture Section */}
      <section
        id="architecture"
        style={{
          padding: '80px 24px',
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Engineering Architecture
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Decoupled 4-Tier Production Architecture
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '680px', margin: '8px auto 0' }}>
            Built in alignment with standard enterprise fintech patterns to ensure fault isolation,
            independent tier scalability, and strict security boundaries.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {systemTiers.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.tier}
                className="card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${t.color}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: t.bg,
                        color: t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: t.color,
                        backgroundColor: t.bg,
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {t.tier}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {t.name}
                  </h3>

                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '14px',
                    }}
                  >
                    {t.tech}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction Workflow Section */}
      <section
        id="workflow"
        style={{
          padding: '80px 24px',
          backgroundColor: 'var(--bg-card-subtle)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--primary)',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              Real-Time Pipeline
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              How TrustPay Mitigates Fraud in Real-Time
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0' }}>
              Every single payment traverses four automated checkpoints before fund settlement.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              position: 'relative',
            }}
          >
            {[
              {
                step: '01',
                title: 'Initiation & Telemetry',
                desc: 'User issues transaction. Client binds browser device identifier, timestamp, and optional geolocation coordinates.',
              },
              {
                step: '02',
                title: 'API Gateway Orchestration',
                desc: 'Node.js Express gateway authenticates JWT, queries recent 15-minute velocity window, and dispatches payload to Sentinel AI.',
              },
              {
                step: '03',
                title: 'Machine Learning Scoring',
                desc: 'FastAPI microservice feeds features into LightGBM model. Groq Llama 3.3 synthesizes natural language risk rationale.',
              },
              {
                step: '04',
                title: 'Atomic Settlement / Audit Hold',
                desc: 'Low/Medium risk settles instantly via MySQL stored procedures. High-risk locks in PENDING state for operator telephone review.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="card"
                style={{
                  padding: '24px',
                  position: 'relative',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.8,
                    marginBottom: '12px',
                  }}
                >
                  {s.step}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities / Features Grid */}
      <section
        id="features"
        style={{
          padding: '80px 24px',
          maxWidth: '1240px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Core Capabilities
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Built for Modern Security & High Concurrency
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0' }}>
            Engineered with modern cryptographic, probabilistic, and relational data safeguards.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card"
                style={{
                  padding: '26px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* College Project Team Members Section (Requested) */}
      <section
        id="team"
        style={{
          padding: '84px 24px',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
              }}
            >
              <GraduationCap size={16} />
              <span>Project Team Members</span>
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Project Contributors
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0' }}>
              Department of Computer Science & Engineering • Final Year Major Project
            </p>
          </div>

          {/* Team Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {teamMembers.map((m, idx) => (
              <div
                key={m.regNo}
                className="card"
                style={{
                  padding: '28px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                {/* Avatar Initials */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                    marginBottom: '16px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {m.initials}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '6px',
                  }}
                >
                  Member {idx + 1}
                </div>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '10px',
                  }}
                >
                  {m.name}
                </h3>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--primary)',
                    marginBottom: '10px',
                  }}
                >
                  <span>Reg No:</span>
                  <span>{m.regNo}</span>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  B.Tech • Computer Science & Engineering
                </div>
              </div>
            ))}
          </div>

          {/* Academic Mentorship / Supervision Callout Card */}
          <div
            className="card"
            style={{
              padding: '24px 32px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Academic Supervision & Departmental Guidance
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Final Year Major Project Evaluation • Department of Computer Science & Engineering
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={handleLaunchApp}
                className="btn btn-primary btn-sm"
              >
                <span>Launch Live System</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Pre-Footer Banner */}
      <section
        style={{
          padding: '64px 24px',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, marginBottom: '14px' }}>
            Ready to explore TrustPay in action?
          </h2>
          <p style={{ fontSize: '15px', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '30px' }}>
            Sign in as a retail customer to initiate simulated transactions or enter the compliance
            dashboard to inspect real-time fraud alerts and machine learning forensics.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-lg"
              onClick={handleLaunchApp}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1D4ED8',
                fontWeight: 700,
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              }}
            >
              <span>{isAuthenticated ? 'Go to Your Dashboard' : 'Open Demo Banking Portal'}</span>
              <ArrowRight size={18} />
            </button>

            <Link
              to="/login"
              className="btn btn-secondary btn-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              Sign In with Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '36px 24px',
          backgroundColor: 'var(--bg-main)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={16} />
            </div>
            <span>
              <strong>TRUSTPAY</strong> • B.Tech Engineering Major Project 2026
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a href="#features" style={{ color: 'var(--text-secondary)' }}>
              Features
            </a>
            <a href="#architecture" style={{ color: 'var(--text-secondary)' }}>
              Architecture
            </a>
            <a href="#team" style={{ color: 'var(--text-secondary)' }}>
              Team
            </a>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Portal Access
            </Link>
          </div>
        </div>
      </footer>

      {/* Responsive media styling for landing page */}
      <style>{`
        @media (max-width: 860px) {
          .landing-nav-desktop {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .backend-health-pill {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
