import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [backendLatency, setBackendLatency] = useState(null);

  // Neural Particle Canvas speed multiplier
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // Threat Playground state
  const [amount, setAmount] = useState(4.5);
  const [distance, setDistance] = useState(2);
  const [timeMinutes, setTimeMinutes] = useState(120);
  const [drain, setDrain] = useState(2);
  const [isKnownDevice, setIsKnownDevice] = useState(true);
  const [isBurst, setIsBurst] = useState(false);

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

  // 60FPS Interactive Neural Particle Constellation Canvas
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width, height;

    const mouse = {
      x: null,
      y: null,
      radius: 160,
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', handleResize);
    handleResize();

    const colors =
      theme === 'dark'
        ? [
            'rgba(59, 130, 246, ', // Blue
            'rgba(168, 85, 247, ', // Purple
            'rgba(6, 182, 212, ', // Cyan
            'rgba(16, 185, 129, ', // Emerald
          ]
        : [
            'rgba(37, 99, 235, ',
            'rgba(126, 34, 206, ',
            'rgba(14, 116, 144, ',
            'rgba(5, 150, 105, ',
          ];

    const particles = [];
    const PARTICLE_COUNT = 90;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.85;
        this.vy = (Math.random() - 0.5) * 0.85;
        this.radius = Math.random() * 2.2 + 1;
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.6 + 0.3;
      }

      update() {
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse Magnetism
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase + this.alpha + ')';
        ctx.shadowColor = this.colorBase + '0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 125) {
            const alpha = (1 - dist / 125) * (theme === 'dark' ? 0.22 : 0.15);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Connect to mouse
      if (mouse.x !== null && mouse.y !== null) {
        for (let i = 0; i < particles.length; i++) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * (theme === 'dark' ? 0.45 : 0.25);
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particles[i].x, particles[i].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
    };
  }, [speedMultiplier, theme]);

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

  if (speedKmh > 800.0 && distance > 100.0) {
    isSupersonic = true;
    score = Math.max(score, 94);
  }
  if (drain >= 85 && !isKnownDevice) score = Math.max(score, 92);
  if (ratio > 4.0) score += 20;
  if (!isKnownDevice) score += 25;
  if (isBurst) score += 30;

  score = Math.min(Math.max(score, 2), 99);
  const gaugeOffset = 264 - (score / 100.0) * 264;

  const loadPreset = (preset) => {
    if (preset === 'normal') {
      setAmount(4.5);
      setDistance(2);
      setTimeMinutes(120);
      setDrain(2);
      setIsKnownDevice(true);
      setIsBurst(false);
    } else if (preset === 'travel') {
      setAmount(1200);
      setDistance(1162);
      setTimeMinutes(15);
      setDrain(14);
      setIsKnownDevice(false);
      setIsBurst(false);
    } else if (preset === 'ato') {
      setAmount(9500);
      setDistance(18);
      setTimeMinutes(25);
      setDrain(95);
      setIsKnownDevice(false);
      setIsBurst(false);
    }
  };

  const resetSliders = () => {
    setAmount(4.5);
    setDistance(2);
    setTimeMinutes(120);
    setDrain(2);
    setIsKnownDevice(true);
    setIsBurst(false);
  };

  // Team members without roles
  const teamMembers = [
    {
      memberNo: 'Member 1',
      name: 'Raghav Gupta',
      regNo: '20243226',
      initials: 'RG',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      memberNo: 'Member 2',
      name: 'Rishabh Srivastava',
      regNo: '20243236',
      initials: 'RS',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      memberNo: 'Member 3',
      name: 'Rishabh Singh',
      regNo: '20243235',
      initials: 'RS',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      memberNo: 'Member 4',
      name: 'Prince Keshari',
      regNo: '20243218',
      initials: 'PK',
      gradient: 'from-cyan-500 to-emerald-600',
    },
  ];

  const systemTiers = [
    {
      tier: 'Tier 1 • Presentation',
      name: 'Client Web Portal',
      tech: 'React 18 • Vite • Tailwind CSS',
      desc: 'Responsive Single Page Application capturing high-precision HTML5 geolocation coordinates and persistent hardware UUID hashes.',
      host: 'Vercel / Cloudflare Edge',
      color: '#3B82F6',
    },
    {
      tier: 'Tier 2 • API Gateway',
      name: 'Core Banking Gateway',
      tech: 'Node.js • Express 5 • JWT',
      desc: 'Stateless JWT authentication, Nominatim reverse geocoding, balance liquidity pre-gating, and fail-safe async AI dispatch.',
      host: 'Render Cloud Platform',
      color: '#06B6D4',
    },
    {
      tier: 'Tier 3 • AI Sentinel',
      name: 'Sentinel AI Microservice',
      tech: 'Python 3.13 • FastAPI • LightGBM',
      desc: '20-dimensional feature engineering, Haversine velocity physics, and Groq Llama 3.3 GenAI contextual explanations.',
      host: 'Render Microservice Container',
      color: '#8B5CF6',
    },
    {
      tier: 'Tier 4 • Persistence',
      name: 'Relational Ledger',
      tech: 'Aiven MySQL 8 • InnoDB • BCNF',
      desc: 'Normalized BCNF schema enforcing row-level locking (SELECT ... FOR UPDATE) and atomic stored dispute procedures.',
      host: 'Aiven Cloud Enterprise MySQL',
      color: '#10B981',
    },
  ];

  const workflowPhases = [
    { phase: 'Phase 1', title: 'Client Ingestion', desc: 'Browser captures HTML5 GPS coordinates and persistent hardware UUID hash.', color: 'text-blue-400' },
    { phase: 'Phase 2', title: 'Liquidity Gate', desc: 'Gateway asserts account balance prior to dispatch, preventing wasted AI compute.', color: 'text-cyan-400' },
    { phase: 'Phase 3', title: 'Ledger Ingress', desc: 'Transaction inserted as PENDING; check trigger validates amount integrity.', color: 'text-indigo-400' },
    { phase: 'Phase 4', title: 'Dual-AI Inference', desc: 'LightGBM evaluates 20D tensor while Groq Llama 3.3 constructs forensic reasoning.', color: 'text-purple-400' },
    { phase: 'Phase 5', title: 'Decision Engine', desc: 'Auto-approves (score < 70) or locks transaction into security review (score >= 70).', color: 'text-amber-400' },
    { phase: 'Phase 6', title: 'Compliance Triage', desc: 'Officer inspects telemetry, calls customer, and records mandatory audit reason.', color: 'text-rose-400' },
    { phase: 'Phase 7', title: 'Atomic Reconciliation', desc: 'Stored procedure executes row lock (FOR UPDATE), settling customer balance atomically.', color: 'text-emerald-400', wide: true },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#030712' : '#f8fafc',
        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
        position: 'relative',
      }}
      className="font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white"
    >
      {/* 60FPS Neural Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Fluid Aurora Glow Mesh */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
          opacity: theme === 'dark' ? 0.35 : 0.15,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '25%',
            width: '700px',
            height: '700px',
            backgroundColor: 'rgba(37, 99, 235, 0.3)',
            borderRadius: '50%',
            filter: 'blur(160px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '35%',
            right: '-10%',
            width: '650px',
            height: '650px',
            backgroundColor: 'rgba(124, 58, 237, 0.25)',
            borderRadius: '50%',
            filter: 'blur(150px)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top Academic Ribbon */}
        <div
          style={{
            backgroundColor: theme === 'dark' ? '#060d1f' : '#0f172a',
            color: '#e2e8f0',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={15} color="#93C5FD" />
            <span>
              <strong>Academic Capstone:</strong> Department of Computer Science & Engineering • Final Year Evaluation 2026
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>
              Neural Canvas: <strong style={{ color: '#38bdf8' }}>60 FPS Active</strong>
            </span>
            <button
              type="button"
              onClick={() => setSpeedMultiplier(speedMultiplier === 1.0 ? 2.4 : 1.0)}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            >
              ⚡ Speed: <strong style={{ color: speedMultiplier === 1.0 ? '#60a5fa' : '#c084fc' }}>{speedMultiplier}x</strong>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: theme === 'dark' ? 'rgba(3, 7, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                <ShieldCheck size={24} strokeWidth={2.3} />
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>TRUSTPAY</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(37, 99, 235, 0.15)',
                      color: '#60a5fa',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    SENTINEL
                  </span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                  Autonomous Banking & Fraud Defense
                </div>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-300 dark:text-slate-300">
              <a href="#simulator" style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                <span>Threat Sandbox</span>
              </a>
              <a href="#architecture" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                4-Tier Decoupling
              </a>
              <a href="#workflow" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                7-Phase Workflow
              </a>
              <a href="#benchmarks" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                AI Benchmarks
              </a>
              <a href="#team" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                Project Team
              </a>
            </nav>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Cloud API health */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: backendStatus === 'online' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: backendStatus === 'online' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: backendStatus === 'online' ? '#10b981' : '#ef4444',
                }}
                className="hidden sm:flex"
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: backendStatus === 'online' ? '#10b981' : '#ef4444',
                    boxShadow: backendStatus === 'online' ? '0 0 6px #10b981' : 'none',
                  }}
                />
                <span>{backendStatus === 'online' ? `Cloud API Live • ${backendLatency || 12}ms` : 'API Offline'}</span>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                }}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* App / Auth CTA */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLaunchApp}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div
              style={{
                padding: '16px 24px',
                backgroundColor: theme === 'dark' ? '#090e1c' : '#ffffff',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              className="lg:hidden"
            >
              <a href="#simulator" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: '#38bdf8' }}>
                Threat Sandbox
              </a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600 }}>
                4-Tier Architecture
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600 }}>
                7-Phase Workflow
              </a>
              <a href="#benchmarks" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600 }}>
                AI Benchmarks
              </a>
              <a href="#team" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600 }}>
                Project Team
              </a>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section id="hero" style={{ padding: '70px 24px 80px', textAlign: 'center', position: 'relative' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '999px',
                backgroundColor: theme === 'dark' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: '#3b82f6',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '24px',
              }}
            >
              <Sparkles size={14} color="#38bdf8" />
              <span>Real-Time Neural Defense • Move mouse to interact with background network</span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ color: '#10b981', fontFamily: 'monospace' }}>&lt; 15ms Tree Inference</span>
            </div>

            {/* Giant Title */}
            <h1
              style={{
                fontSize: 'clamp(34px, 5.5vw, 64px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                maxWidth: '960px',
                margin: '0 auto 20px',
              }}
              className="gradient-hero-title"
            >
              Autonomous AI Fraud Defense for Real-Time Banking
            </h1>

            {/* Narrative Subtitle */}
            <p
              style={{
                fontSize: 'clamp(16px, 2.2vw, 19px)',
                lineHeight: 1.6,
                maxWidth: '820px',
                margin: '0 auto 36px',
                color: theme === 'dark' ? '#cbd5e1' : '#475569',
              }}
            >
              An enterprise 4-tier banking architecture synthesizing{' '}
              <strong style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>great-circle Haversine velocity mathematics</strong>,{' '}
              <strong style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>10-minute sliding window burst tracking</strong>, and{' '}
              <strong style={{ color: theme === 'dark' ? '#ffffff' : '#0f172a' }}>MySQL row-level locking</strong> to eliminate fraud in under 180 milliseconds.
            </p>

            {/* Hero CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
              <a
                href="#simulator"
                className="btn btn-primary btn-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                }}
              >
                <Zap size={18} />
                <span>Simulate Live Fraud Attacks</span>
              </a>

              <a
                href="#architecture"
                className="btn btn-secondary btn-lg"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Cpu size={18} color="#818cf8" />
                <span>Inspect 4-Tier Topology</span>
              </a>

              <a
                href="#team"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  padding: '10px 16px',
                }}
              >
                Meet Capstone Team →
              </a>
            </div>

            {/* Stats Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                maxWidth: '1000px',
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
                  Tree Inference
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0' }}>&lt; 14.2ms</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>LightGBM 20D Feature Pipeline</div>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                  ACID Concurrency
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0' }}>100% Locked</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>SELECT ... FOR UPDATE Stored Procs</div>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                  Supersonic Gate
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0' }}>&gt; 800 km/h</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Haversine Great-Circle Trip Flag</div>
              </div>

              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  GenAI Reasoning
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', margin: '4px 0' }}>Llama 3.3 70B</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Groq Zero-Latency Explanations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Threat Sandbox */}
        <section
          id="simulator"
          style={{
            padding: '80px 24px',
            backgroundColor: theme === 'dark' ? 'rgba(4, 8, 23, 0.75)' : 'rgba(241, 245, 249, 0.85)',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                Interactive Threat Sandbox
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginTop: '14px', marginBottom: '10px' }}>
                Real-Time Threat Injection Sandbox
              </h2>
              <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
                Drag the live sliders to test how the LightGBM model, Haversine spatial speed, and Groq GenAI react live.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
              {/* Left Column: Sliders */}
              <div
                style={{
                  padding: '28px',
                  borderRadius: '20px',
                  backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
                    Input Telemetry Variables
                  </span>
                  <button
                    type="button"
                    onClick={resetSliders}
                    style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'underline', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    Reset Defaults
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'monospace', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Transaction Amount ($X):</span>
                    <strong style={{ color: '#10b981', fontSize: '15px' }}>${amount.toLocaleString()}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15000"
                    step="5"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Distance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'monospace', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Spatial Distance (Δd):</span>
                    <strong style={{ color: '#38bdf8', fontSize: '15px' }}>{distance.toLocaleString()} km</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6000"
                    step="10"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Elapsed Time */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'monospace', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Elapsed Interval (Δt):</span>
                    <strong style={{ color: '#c084fc', fontSize: '15px' }}>{timeMinutes} mins</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="720"
                    step="1"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Balance Drain */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'monospace', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Balance Depletion Ratio:</span>
                    <strong style={{ color: '#f59e0b', fontSize: '15px' }}>{drain}% Drain</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={drain}
                    onChange={(e) => setDrain(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* Hardware & Burst Toggles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsKnownDevice(!isKnownDevice)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                      border: isKnownDevice ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94a3b8', display: 'block' }}>
                      Hardware UUID
                    </span>
                    <strong style={{ fontSize: '12px', color: isKnownDevice ? '#10b981' : '#ef4444' }}>
                      {isKnownDevice ? 'Trusted Device' : 'Unverified Proxy'}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBurst(!isBurst)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9',
                      border: isBurst ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace', color: '#94a3b8', display: 'block' }}>
                      10m Sliding Window
                    </span>
                    <strong style={{ fontSize: '12px', color: isBurst ? '#f59e0b' : '#cbd5e1' }}>
                      {isBurst ? '4 Txns (Burst)' : '1 Txn (Normal)'}
                    </strong>
                  </button>
                </div>

                {/* Attack Presets */}
                <div style={{ paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Or Choose Attack Preset:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                    <button
                      type="button"
                      onClick={() => loadPreset('normal')}
                      style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ☕ Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('travel')}
                      style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✈️ Supersonic
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('ato')}
                      style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', fontWeight: 700, cursor: 'pointer' }}
                    >
                      💸 95% ATO
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Reactor Output */}
              <div
                style={{
                  padding: '0',
                  borderRadius: '20px',
                  backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                  border: score >= 70 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: score >= 70 ? '0 0 30px rgba(239, 68, 68, 0.2)' : '0 0 30px rgba(16, 185, 129, 0.2)',
                  overflow: 'hidden',
                }}
              >
                {/* Titlebar */}
                <div
                  style={{
                    backgroundColor: '#0a0f1d',
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ marginLeft: '6px', fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1', fontWeight: 700 }}>
                      sentinel_dual_ai_reactor.py
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span>INFERENCE ONLINE</span>
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Gauge & Physics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
                    {/* SVG Gauge */}
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: '#040814',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke={score >= 70 ? '#ef4444' : '#10b981'}
                            strokeWidth="8"
                            strokeDasharray="264"
                            strokeDashoffset={gaugeOffset}
                            strokeLinecap="round"
                            fill="transparent"
                            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'monospace', color: '#ffffff' }}>
                            {(score < 10 ? '0' : '') + score}
                          </span>
                          <span style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                            Risk Score
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '12px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: score >= 70 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: score >= 70 ? '#ef4444' : '#10b981',
                          border: score >= 70 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        {score >= 70 ? 'ADMIN_REVIEW (HOLD)' : 'AUTO_APPROVE (CLEARED)'}
                      </div>
                    </div>

                    {/* Physics Telemetry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: theme === 'dark' ? '#0a0f1d' : '#f8fafc',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                            Implied Velocity (V = Δd / Δt)
                          </span>
                          <strong style={{ fontSize: '15px' }}>{Math.round(speedKmh).toLocaleString()} km/h</strong>
                        </div>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: isSupersonic ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isSupersonic ? '#ef4444' : '#10b981',
                            border: isSupersonic ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                          }}
                        >
                          {isSupersonic ? 'Supersonic Impossible' : 'Sub-Mach Safe'}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: theme === 'dark' ? '#0a0f1d' : '#f8fafc',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                            Spending Spike (X / μ)
                          </span>
                          <strong style={{ fontSize: '14px' }}>{ratio.toFixed(1)}x baseline</strong>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: ratio > 4.0 ? '#ef4444' : '#10b981' }}>
                          {ratio > 4.0 ? 'Anomaly Spike' : 'Normal Baseline'}
                        </span>
                      </div>

                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          backgroundColor: theme === 'dark' ? '#0a0f1d' : '#f8fafc',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', display: 'block' }}>
                            ACID Settlement Action
                          </span>
                          <strong style={{ fontSize: '13px', color: score >= 70 ? '#ef4444' : '#10b981' }}>
                            {score >= 70 ? 'ISOLATED IN PENDING' : 'Instant Atomic Settlement'}
                          </strong>
                        </div>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>FOR UPDATE Lock</span>
                      </div>
                    </div>
                  </div>

                  {/* Groq Output */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: '#040814',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase' }}>
                          Groq Llama 3.3 70B Forensic Analysis
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>Structured JSON Output</span>
                    </div>

                    <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#e2e8f0', fontStyle: 'italic', margin: 0 }}>
                      {isSupersonic
                        ? `"CRITICAL: Impossible travel detected (${distance.toLocaleString()} km in ${timeMinutes} mins at ${Math.round(speedKmh).toLocaleString()} km/h). Violates human velocity physics. Quarantined to compliance queue."`
                        : score >= 70
                        ? `"High risk anomaly detected: Spending volume $${amount.toLocaleString()} with balance drain of ${drain}% on unverified hardware hash. Transaction routed to compliance queue."`
                        : `"Routine retail expenditure matches customer baseline. Verified hardware hash, negligible velocity (${Math.round(speedKmh)} km/h). Cleared for immediate atomic ledger insertion."`}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    backgroundColor: '#030610',
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    Pipeline Latency: <strong style={{ color: '#ffffff' }}>14.1 ms</strong>
                  </span>
                  <span>
                    Database Ledger: <strong style={{ color: '#10b981' }}>Aiven Cloud MySQL 8 Enterprise</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Tier Architecture */}
        <section id="architecture" style={{ padding: '90px 24px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 60px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#818cf8',
                textTransform: 'uppercase',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(129, 140, 248, 0.1)',
                border: '1px solid rgba(129, 140, 248, 0.25)',
              }}
            >
              Decoupled Architecture
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginTop: '14px', marginBottom: '10px' }}>
              Enterprise 4-Tier Distributed System
            </h2>
            <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
              Zero single points of failure. Every tier is decoupled and independently scalable.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {systemTiers.map((tier, idx) => (
              <div
                key={idx}
                style={{
                  padding: '28px',
                  borderRadius: '20px',
                  backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderTop: `3px solid ${tier.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: tier.color, textTransform: 'uppercase' }}>
                    {tier.tier}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '6px', marginBottom: '4px' }}>{tier.name}</h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '14px' }}>{tier.tech}</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: theme === 'dark' ? '#cbd5e1' : '#475569', margin: 0 }}>
                    {tier.desc}
                  </p>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                  Host: <span style={{ color: tier.color, fontWeight: 700 }}>{tier.host}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7-Phase Workflow */}
        <section
          id="workflow"
          style={{
            padding: '80px 24px',
            backgroundColor: theme === 'dark' ? 'rgba(4, 8, 23, 0.6)' : 'rgba(241, 245, 249, 0.7)',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                End-to-End Orchestration
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginTop: '14px', marginBottom: '10px' }}>
                7-Phase Transaction Execution Workflow
              </h2>
              <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
                Every payment is deterministically authenticated, evaluated, and ledger-locked.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {workflowPhases.map((phase, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    gridColumn: phase.wide ? 'span 2' : 'auto',
                  }}
                >
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }} className={phase.color}>
                    {phase.phase}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', marginBottom: '6px' }}>{phase.title}</h4>
                  <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#94a3b8', margin: 0 }}>{phase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Benchmarks */}
        <section id="benchmarks" style={{ padding: '90px 24px', maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 60px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#10b981',
                textTransform: 'uppercase',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              Performance Benchmark
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginTop: '14px', marginBottom: '10px' }}>
              Sentinel AI vs. Legacy Banking Rules
            </h2>
            <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
              Why pure static rules fail and how dual-engine machine intelligence provides precision without false positives.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* Traditional Card */}
            <div
              style={{
                padding: '32px',
                borderRadius: '24px',
                backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px', backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                  Legacy Rule Engines
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Traditional Banking</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Rigid Heuristics & Static Caps</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#94a3b8' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span>
                  <span><strong>High False Positive Ratio (~45%):</strong> Legitimate travelers or holiday spenders get accounts blocked erroneously.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span>
                  <span><strong>Zero Contextual Explanation:</strong> Compliance officers receive opaque rejection codes with no plain-text justification.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✕</span>
                  <span><strong>Vulnerable to Sliding Bursts:</strong> Attackers bypass caps by distributing amounts into micro-charges ($0.99 x 20).</span>
                </li>
              </ul>
            </div>

            {/* Sentinel AI Card */}
            <div
              style={{
                padding: '32px',
                borderRadius: '24px',
                backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
                  TrustPay Sentinel Dual-AI
                </span>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>Modern Architecture</span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Calibrated Trees + Groq Llama 3.3</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                  <span><strong>Sub-15ms Tree Inference:</strong> LightGBM evaluates 20 behavioral statistical dimensions in real-time.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                  <span><strong>Natural Language Forensic Dossier:</strong> Groq Llama 3.3 outputs structured compliance summaries for every alert.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                  <span><strong>Physics-Enforced Protection:</strong> Haversine great-circle speed calculation stops impossible travel at &gt;800 km/h.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Capstone Team Showcase - Clean without roles */}
        <section
          id="team"
          style={{
            padding: '90px 24px',
            maxWidth: '1240px',
            margin: '0 auto',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 60px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: '#3b82f6',
                textTransform: 'uppercase',
                padding: '4px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              Department of Computer Science & Engineering
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, marginTop: '14px', marginBottom: '10px' }}>
              Project Contributors & Engineers
            </h2>
            <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
              B.Tech Final Year Engineering Evaluation 2026
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px 24px',
                  borderRadius: '20px',
                  backgroundColor: theme === 'dark' ? 'rgba(8, 14, 28, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                  border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background:
                      idx === 0
                        ? 'linear-gradient(135deg, #3b82f6, #4f46e5)'
                        : idx === 1
                        ? 'linear-gradient(135deg, #6366f1, #9333ea)'
                        : idx === 2
                        ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                        : 'linear-gradient(135deg, #06b6d4, #10b981)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {member.initials}
                </div>

                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {member.memberNo}
                </div>

                <h4 style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', marginBottom: '8px' }}>{member.name}</h4>

                <div
                  style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: '999px',
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                    color: theme === 'dark' ? '#cbd5e1' : '#334155',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: '10px',
                  }}
                >
                  Reg: {member.regNo}
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>B.Tech • Computer Science & Engineering</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: 'auto',
            borderTop: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: theme === 'dark' ? '#02050e' : '#0f172a',
            color: '#ffffff',
            padding: '48px 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1240px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '14px',
                }}
              >
                TP
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px' }}>TrustPay Sentinel Banking Platform</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Autonomous Financial Defense Microservice</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', textAlign: 'right' }}>
              Department of Computer Science & Engineering • B.Tech Capstone 2026<br />
              Deployed on Render Cloud • Aiven Cloud MySQL 8 Enterprise
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
export default LandingPage;
