import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import TrustPayHero3D from '../components/ThreeD/TrustPayHero3D';
import {
  ShieldCheck,
  ArrowRight,
  Sliders,
  Sun,
  Moon,
  Menu,
  X,
  FileText,
  Download,
  Zap,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [backendLatency, setBackendLatency] = useState(null);

  // Threat Playground state
  const [amount, setAmount] = useState(4.5);
  const [distance, setDistance] = useState(2);
  const [timeMinutes, setTimeMinutes] = useState(120);
  const [drain, setDrain] = useState(2);
  const [isKnownDevice, setIsKnownDevice] = useState(true);
  const [isBurst, setIsBurst] = useState(false);

  // Check live backend connectivity
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const startTime = performance.now();
      try {
        const res = await api.get('/health', { timeout: 8000 });
        const latency = Math.round(performance.now() - startTime);
        if (isMounted) {
          setBackendStatus(res.data && res.data.status === 'OK' ? 'online' : 'online');
          setBackendLatency(latency);
        }
      } catch {
        if (isMounted) {
          setBackendStatus('offline');
          setBackendLatency(null);
        }
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
    };
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

  // Threat calculation math
  const speedKmh = timeMinutes > 0 ? distance / (timeMinutes / 60.0) : 0;
  const ratio = amount / 50.0;
  let score = 3;
  let isSupersonic = false;

  if (speedKmh > 300) {
    score += 48;
    isSupersonic = true;
  } else if (speedKmh > 120) {
    score += 26;
  } else if (speedKmh > 50) {
    score += 12;
  }

  if (ratio > 5.0) score += 38;
  else if (ratio > 2.5) score += 24;
  else if (ratio > 1.4) score += 12;

  if (drain > 45) score += 32;
  else if (drain > 25) score += 18;
  else if (drain > 12) score += 8;

  if (!isKnownDevice) score += 22;
  if (isBurst) score += 18;

  const finalScore = Math.min(Math.max(score, 1), 99);
  const finalDecision = finalScore >= 70 ? 'REJECT' : finalScore >= 40 ? 'HOLD' : 'ALLOW';
  const threatLevel = finalScore >= 70 ? 'CRITICAL' : finalScore >= 40 ? 'MEDIUM' : 'LOW';

  const applyPreset = (presetKey) => {
    switch (presetKey) {
      case 'normal':
        setAmount(3.5);
        setDistance(1.5);
        setTimeMinutes(120);
        setDrain(2.0);
        setIsKnownDevice(true);
        setIsBurst(false);
        break;
      case 'midnight':
        setAmount(28.0);
        setDistance(14.0);
        setTimeMinutes(25);
        setDrain(34.0);
        setIsKnownDevice(false);
        setIsBurst(false);
        break;
      case 'burst':
        setAmount(14.5);
        setDistance(3.0);
        setTimeMinutes(5);
        setDrain(18.0);
        setIsKnownDevice(true);
        setIsBurst(true);
        break;
      case 'supersonic':
        setAmount(45.0);
        setDistance(480.0);
        setTimeMinutes(45);
        setDrain(42.0);
        setIsKnownDevice(false);
        setIsBurst(true);
        break;
      default:
        break;
    }
  };

  const systemServices = [
    {
      id: 'ui',
      port: ':5173',
      name: 'Client Presentation Layer',
      tech: 'React 19 • Vite • Router v7',
      desc: 'High-performance SPA with client GPS geolocation telemetry and persistent hardware device fingerprinting.',
      badge: 'Frontend Mesh',
      color: '#38bdf8',
    },
    {
      id: 'gateway',
      port: ':5000',
      name: 'Core Banking API Gateway',
      tech: 'Node.js 20 • Express 5 • amqplib',
      desc: 'Stateless JWT RBAC, balance pre-gating, and non-blocking HTTP 202 Accepted message producer for RabbitMQ.',
      badge: 'API Gateway',
      color: '#818cf8',
    },
    {
      id: 'rabbitmq',
      port: ':5672',
      name: 'RabbitMQ Message Broker',
      tech: 'RabbitMQ 3 • AMQP 0-9-1',
      desc: 'Durable fraud_evaluation_queue decoupling CPU/IO-bound ML inference (<15ms gateway response).',
      badge: 'Async Broker',
      color: '#f43f5e',
    },
    {
      id: 'redis',
      port: ':6379',
      name: 'Redis 7 Cache & Rate Limiter',
      tech: 'Redis 7 Alpine • ZSET Pipeline',
      desc: 'Sliding-window limiter (5 req/10s per user) with AOF persistence and sub-2ms cached read endpoints.',
      badge: 'Cache / Limiter',
      color: '#0284c7',
    },
    {
      id: 'sentinel',
      port: ':8000',
      name: 'Sentinel AI Intelligence Worker',
      tech: 'FastAPI • LightGBM • Groq LPU',
      desc: '14-feature gradient boosted tree ensemble (1.27ms p50) paired with Groq Llama 3.3 70B forensic audit reasoning.',
      badge: 'ML / GenAI',
      color: '#f59e0b',
    },
    {
      id: 'mysql',
      port: ':3306',
      name: 'Relational Ledger DB',
      tech: 'MySQL 8.0 • InnoDB • BCNF',
      desc: '8-entity Boyce-Codd Normal Form schema with row-level locks (SELECT FOR UPDATE) and automated triggers.',
      badge: 'ACID Ledger',
      color: '#10b981',
    },
  ];

  const workflowPhases = [
    {
      phase: '01',
      title: 'Client Ingestion & Telemetry',
      desc: 'Captures HTML5 geolocation lat/long, hardware device UUID hash, and payment payload.',
      budget: '< 2 ms',
    },
    {
      phase: '02',
      title: 'Gateway Pre-Validation & Ingress',
      desc: 'Express gateway verifies Bearer JWT, asserts account balance sufficiency, and enforces Redis rate limits.',
      budget: '< 5 ms',
    },
    {
      phase: '03',
      title: 'Ledger Hold & AMQP Dispatch',
      desc: 'Writes initial PENDING row to MySQL and publishes persistent message to RabbitMQ; returns HTTP 202.',
      budget: '< 15 ms',
    },
    {
      phase: '04',
      title: 'Dual-AI Model Inference',
      desc: 'FastAPI extracts 14 behavioral features; LightGBM scores 0-100 probability while Groq LPU drafts reasoning.',
      budget: '1.27 ms',
    },
    {
      phase: '05',
      title: 'Deterministic Decision Engine',
      desc: 'Fuses ML probabilities with institutional rules (impossible travel, ATO triad, rapid burst testing).',
      budget: '< 0.01 ms',
    },
    {
      phase: '06',
      title: 'Row-Locked Atomic Settlement',
      desc: 'Executes ApproveTransaction or creates open triage alert using InnoDB row-level locking (SELECT FOR UPDATE).',
      budget: '< 8 ms',
    },
    {
      phase: '07',
      title: 'Real-time WebSocket & Client Sync',
      desc: 'Dispatches finalized status notification to customer banking portal and populates compliance review queues.',
      budget: '< 4 ms',
    },
  ];

  const teamMembers = [
    {
      name: 'Raghav Garg',
      regNo: '20243224',
      role: 'Full-Stack Architecture • Distributed Systems & RabbitMQ',
      initials: 'RG',
    },
    {
      name: 'Rohan Sharma',
      regNo: '20243236',
      role: 'Backend & Gateway • Node.js, Express & Redis Limiter',
      initials: 'RS',
    },
    {
      name: 'Rishabh Singh',
      regNo: '20243235',
      role: 'Machine Learning • LightGBM & Feature Eng',
      initials: 'RS',
    },
    {
      name: 'Prince Keshari',
      regNo: '20243218',
      role: 'Database Architecture • MySQL 8 BCNF Ledger',
      initials: 'PK',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* ========================================================================
          APPLE-STYLE STICKY FROSTED GLASS NAVIGATION BAR
          ======================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0071E3 0%, #4338ca 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)',
              }}
            >
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                TRUST<span style={{ color: 'var(--primary)' }}>PAY</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                v2.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            className="hidden lg:flex"
            style={{
              alignItems: 'center',
              gap: '28px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
          >
            <a href="#simulator" style={{ transition: 'color 0.2s' }}>Threat Lab</a>
            <a href="#architecture" style={{ transition: 'color 0.2s' }}>6-Service Mesh</a>
            <a href="#workflow" style={{ transition: 'color 0.2s' }}>Pipeline</a>
            <a href="#benchmarks" style={{ transition: 'color 0.2s' }}>Benchmarks</a>
            <a href="#defense" style={{ transition: 'color 0.2s' }}>Academic Defense</a>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Backend Telemetry Beacon */}
            <div
              className="hidden sm:flex"
              style={{
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: backendStatus === 'online' ? '#10b981' : '#f59e0b',
                  boxShadow: backendStatus === 'online' ? '0 0 8px #10b981' : 'none',
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                {backendStatus === 'online' ? `${backendLatency || 14}ms Mesh` : 'Mesh Sync'}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Launch App Pill */}
            <button
              type="button"
              onClick={handleLaunchApp}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 600 }}
            >
              <span>{isAuthenticated ? 'Enter App' : 'Launch App'}</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '6px',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden"
            style={{
              padding: '16px 24px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)}>Threat Lab</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>6-Service Mesh</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>Pipeline</a>
            <a href="#benchmarks" onClick={() => setMobileMenuOpen(false)}>Benchmarks</a>
            <a href="#defense" onClick={() => setMobileMenuOpen(false)}>Academic Defense</a>
          </div>
        )}
      </header>

      {/* ========================================================================
          HERO STAGE: APPLE MONUMENTAL 3D PRODUCT PRESENTATION
          ======================================================================== */}
      <section
        style={{
          position: 'relative',
          padding: '64px 24px 72px',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* Celestial Ambient Spotlight Glow */}
        <div className="apple-stage-glow" />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Zap size={14} />
            <span>Sentinel AI v2.0 • Forged in Titanium</span>
          </div>

          {/* Hero Monumental Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 68px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              marginBottom: '20px',
            }}
          >
            <span className="text-gradient-apple">Financial intelligence.</span>
            <br />
            <span className="text-gradient-cyan">Engineered for absolute trust.</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              maxWidth: '720px',
              margin: '0 auto 36px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            Next-generation enterprise fraud surveillance fusing 14-feature LightGBM gradient boosted
            decision trees, sub-15ms non-blocking message queues, and BCNF-normalized ACID ledger guarantees.
          </p>

          {/* Hero Action CTAs */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '48px',
            }}
          >
            <button
              type="button"
              onClick={handleLaunchApp}
              className="btn btn-primary btn-lg"
              style={{ minWidth: '200px' }}
            >
              <span>Explore Banking Portal</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#simulator"
              className="btn btn-secondary btn-lg"
              style={{ minWidth: '180px' }}
            >
              <Sliders size={16} />
              <span>Simulate Threat</span>
            </a>
          </div>

          {/* 3D WebGL Titanium Centerpiece Container */}
          <div
            style={{
              position: 'relative',
              maxWidth: '860px',
              margin: '0 auto 36px',
              borderRadius: '32px',
              padding: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
            }}
          >
            <TrustPayHero3D
              riskScore={finalScore}
              threatLevel={threatLevel}
              onCardClick={() => applyPreset(finalScore > 50 ? 'normal' : 'midnight')}
            />
          </div>

          {/* 4-Column Apple Frosted Glass Metric Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {[
              {
                value: '99.98%',
                label: 'Statistical Accuracy',
                sub: 'Holdout ROC-AUC verified',
              },
              {
                value: '1.27 ms',
                label: 'Median ML Latency',
                sub: 'LightGBM on Groq LPU',
              },
              {
                value: 'HTTP 202',
                label: 'Non-Blocking Ingress',
                sub: 'RabbitMQ queue decoupled',
              },
              {
                value: 'BCNF ACID',
                label: 'Row-Locked Ledger',
                sub: 'MySQL 8 InnoDB isolation',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="apple-glass-card"
                style={{
                  padding: '20px 24px',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================
          SECTION 2: INTERACTIVE THREAT SIMULATOR LABORATORY
          ======================================================================== */}
      <section
        id="simulator"
        style={{
          padding: '80px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
              }}
            >
              Interactive Product Lab
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginTop: '6px',
              }}
            >
              Threat Detection Simulator
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Adjust parameters in real time and watch the 3D Sentinel Core and diagnostic engine react live.
            </p>
          </div>

          {/* Attack Vector Presets */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '32px',
            }}
          >
            {[
              { id: 'normal', label: 'Standard Grocery (Clean)' },
              { id: 'midnight', label: 'Midnight POS Spike (Warning)' },
              { id: 'burst', label: 'Rapid Burst Testing (Alert)' },
              { id: 'supersonic', label: 'Supersonic Impossible Travel (Critical)' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '999px',
                  padding: '8px 16px',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Interactive Controls & Radar Display Split Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Left: Interactive Sliders */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>
                Transaction Telemetry Inputs
              </h3>

              {/* Amount Slider */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Transaction Amount</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{(amount * 1000).toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Distance Slider */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Distance from Last Known POS</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {distance} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="800"
                  step="5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Time Slider */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Elapsed Time Delta</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {timeMinutes} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="360"
                  step="1"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {/* Toggle Switches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}>
                  <span>Known Hardware Device Fingerprint</span>
                  <input
                    type="checkbox"
                    checked={isKnownDevice}
                    onChange={(e) => setIsKnownDevice(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', cursor: 'pointer' }}>
                  <span>Rapid Burst Transaction Spike</span>
                  <input
                    type="checkbox"
                    checked={isBurst}
                    onChange={(e) => setIsBurst(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                </label>
              </div>
            </div>

            {/* Right: Live Diagnostic Results Card */}
            <div
              className="card"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  finalScore >= 70
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(15,23,42,0.95) 100%)'
                    : finalScore >= 40
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(15,23,42,0.95) 100%)',
                borderColor:
                  finalScore >= 70
                    ? 'rgba(239, 68, 68, 0.4)'
                    : finalScore >= 40
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'rgba(56, 189, 248, 0.3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Diagnostic Output
                  </span>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor:
                        finalDecision === 'REJECT'
                          ? '#ef4444'
                          : finalDecision === 'HOLD'
                          ? '#f59e0b'
                          : '#10b981',
                      color: '#ffffff',
                    }}
                  >
                    ACTION: {finalDecision}
                  </span>
                </div>

                {/* Score Number Display */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Computed Fraud Probability</div>
                  <div
                    style={{
                      fontSize: '54px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color:
                        finalScore >= 70
                          ? '#ef4444'
                          : finalScore >= 40
                          ? '#f59e0b'
                          : 'var(--text-primary)',
                      lineHeight: 1.1,
                    }}
                  >
                    {finalScore}
                    <span style={{ fontSize: '24px', opacity: 0.6 }}>/100</span>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <span>Physical Travel Velocity</span>
                    <strong style={{ color: isSupersonic ? '#ef4444' : 'inherit' }}>
                      {Math.round(speedKmh)} km/h {isSupersonic && '⚠️ (Impossible Travel)'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <span>Model Inference Time</span>
                    <strong style={{ color: '#10b981' }}>1.27 ms (LightGBM)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-card-subtle)' }}>
                    <span>Ledger Settlement Status</span>
                    <strong>{finalDecision === 'ALLOW' ? 'Atomic InnoDB Commit' : 'Security Triage Hold'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                Deterministic Decision Rule: Scores &gt;= 70 trigger critical cancellation; 40-69 create open administrator triage tickets.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          SECTION 3: 6-SERVICE DISTRIBUTED ARCHITECTURE BENTO GRID
          ======================================================================== */}
      <section
        id="architecture"
        style={{
          padding: '88px 24px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
              }}
            >
              Enterprise Systems Topology
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginTop: '6px',
              }}
            >
              6-Service Distributed Mesh
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Decoupled, high-throughput microservice architecture built for resilience under high concurrency.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {systemServices.map((svc) => (
              <div
                key={svc.id}
                className="apple-glass-card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '24px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-color)',
                        color: svc.color,
                      }}
                    >
                      {svc.badge}
                    </span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {svc.port}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {svc.name}
                  </h3>

                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {svc.tech}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {svc.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '11px',
                    color: '#10b981',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Production Ready Container</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================
          SECTION 4: 7-PHASE SURVEILLANCE PIPELINE
          ======================================================================== */}
      <section
        id="workflow"
        style={{
          padding: '88px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
              }}
            >
              Transaction Lifecycle
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginTop: '6px',
              }}
            >
              7-Phase Surveillance Pipeline
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              From client geolocation ingestion to atomic database settlement in under 45ms end-to-end.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {workflowPhases.map((phase) => (
              <div
                key={phase.phase}
                className="apple-glass-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: '15px',
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  >
                    {phase.phase}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {phase.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {phase.desc}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                >
                  {phase.budget}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================
          SECTION 5: EMPIRICAL BENCHMARKS
          ======================================================================== */}
      <section
        id="benchmarks"
        style={{
          padding: '88px 24px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
              }}
            >
              Rigorous Evaluation
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginTop: '6px',
              }}
            >
              Empirical ML Benchmarks
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Validated against holdout test partitions and industry-standard European credit card datasets.
            </p>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Benchmark Metric</th>
                  <th>TrustPay Holdout</th>
                  <th>ULB European CC</th>
                  <th>IEEE-CIS Standard</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ROC-AUC Score</strong></td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>0.9998</td>
                  <td>0.9842</td>
                  <td>0.9620</td>
                </tr>
                <tr>
                  <td><strong>Precision (Holdout)</strong></td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>99.4%</td>
                  <td>94.1%</td>
                  <td>91.8%</td>
                </tr>
                <tr>
                  <td><strong>Recall (Fraud Catch Rate)</strong></td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>98.2%</td>
                  <td>92.6%</td>
                  <td>89.4%</td>
                </tr>
                <tr>
                  <td><strong>Inference Latency (p50)</strong></td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>1.27 ms</td>
                  <td>8.40 ms</td>
                  <td>14.20 ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================
          SECTION 6: MNNIT ALLAHABAD ACADEMIC DEFENSE & PDF DOWNLOADS
          ======================================================================== */}
      <section
        id="defense"
        style={{
          padding: '88px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
              }}
            >
              Academic Research & Defense
            </span>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginTop: '6px',
              }}
            >
              MNNIT Allahabad Section E2
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Motilal Nehru National Institute of Technology Allahabad • Department of Computer Science & Engineering
            </p>
          </div>

          {/* Team Members Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            {teamMembers.map((member) => (
              <div
                key={member.regNo}
                className="apple-glass-card"
                style={{ padding: '20px' }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    marginBottom: '12px',
                  }}
                >
                  {member.initials}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Reg #{member.regNo}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                  {member.role}
                </div>
              </div>
            ))}
          </div>

          {/* PDF Download Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <FileText size={24} color="var(--primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>MNNIT Submission Report</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                Full A4-formatted institutional project report containing architecture schematics, MySQL BCNF schema proofs, and performance metrics.
              </p>
              <a
                href="/TRUSTPAY_MNNIT_SUBMISSION_REPORT.pdf"
                download="TRUSTPAY_MNNIT_SUBMISSION_REPORT.pdf"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', gap: '8px' }}
              >
                <Download size={14} />
                <span>Download Submission PDF (3.0 MB)</span>
              </a>
            </div>

            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <FileText size={24} color="#10b981" />
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Comprehensive Technical Report</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
                Complete technical specification detailing LightGBM hyperparameter optimization, Redis sliding limiter mechanics, and AMQP queue benchmarks.
              </p>
              <a
                href="/TRUSTPAY_PROJECT_REPORT.pdf"
                download="TRUSTPAY_PROJECT_REPORT.pdf"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', gap: '8px' }}
              >
                <Download size={14} />
                <span>Download Technical Report (3.1 MB)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          FOOTER: APPLE MINIMALIST DESIGN
          ======================================================================== */}
      <footer
        style={{
          padding: '48px 24px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-main)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <span>© 2026 TrustPay Sentinel v2.0</span>
            <span>•</span>
            <span>MNNIT Allahabad Department of CSE</span>
            <span>•</span>
            <span>Distributed Ledger & AI Surveillance Systems</span>
          </div>
          <div>
            Built with React 19, Three.js, Node.js 20, Express 5, RabbitMQ 3, Redis 7, FastAPI, LightGBM, and MySQL 8.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
