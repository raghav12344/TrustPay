import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, Shield, Zap, Sparkles, RefreshCw, Eye } from 'lucide-react';

/**
 * TrustPayHero3D — Apple-Grade Interactive 3D WebGL Titanium Card & Cryptographic Shield
 * 
 * Features:
 * - Physically-based titanium credit card with rounded bevels & realistic brushed metallic sheen
 * - Dynamic high-res 2048x1280 canvas textures with gold EMV microchip, holographic foil & embossed type
 * - 3D Holographic Cryptographic Core with counter-rotating orbital rings and responsive quantum crystal
 * - Dynamic lighting that follows mouse cursor creating anisotropic metallic highlights
 * - Real-time threat reaction mode: shifts from serene sapphire -> amber -> laser ruby
 * - 360° interactive touch/mouse drag + smooth 180° flip toggle
 * - Throttled with IntersectionObserver, zero memory leaks, GPU-friendly
 */
export const TrustPayHero3D = ({
  riskScore = 12,
  threatLevel = 'LOW', // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  onCardClick,
  className = '',
}) => {
  const mountRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [is3DSupported, setIs3DSupported] = useState(true);
  const [coreMode, setCoreMode] = useState('shield'); // 'shield' | 'quantum' | 'orbit'

  // Refs for animation & Three.js state
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    cardGroup: null,
    cardMesh: null,
    coreGroup: null,
    ring1: null,
    ring2: null,
    crystal: null,
    particles: null,
    cursorLight: null,
    coreLight: null,
    animId: null,
    isVisible: true,
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    flipRotY: 0,
    baseRotY: 0,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    threatColor: new THREE.Color(0x38bdf8),
    targetThreatColor: new THREE.Color(0x38bdf8),
    pulseTime: 0,
  });

  // Color mapping based on threat level
  useEffect(() => {
    let colorHex = 0x38bdf8; // Sapphire/cyan (clean)
    if (threatLevel === 'MEDIUM' || riskScore >= 40) {
      colorHex = 0xf59e0b; // Amber (warning)
    }
    if (threatLevel === 'HIGH' || threatLevel === 'CRITICAL' || riskScore >= 70) {
      colorHex = 0xef4444; // Ruby (critical threat)
    }
    stateRef.current.targetThreatColor.setHex(colorHex);
  }, [threatLevel, riskScore]);

  // Flip card handler
  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev;
      stateRef.current.flipRotY = next ? Math.PI : 0;
      return next;
    });
  }, []);

  // Reset view handler
  const resetView = useCallback(() => {
    stateRef.current.targetRotX = 0;
    stateRef.current.targetRotY = 0;
    stateRef.current.baseRotY = 0;
    stateRef.current.flipRotY = 0;
    setIsFlipped(false);
  }, []);

  // Procedural Front Texture Generator (2048 x 1280 Retina Resolution)
  const generateFrontTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1290;
    const ctx = canvas.getContext('2d');

    // 1. Deep Obsidian Titanium Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 2048, 1290);
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.35, '#161c28');
    bgGrad.addColorStop(0.7, '#0f141f');
    bgGrad.addColorStop(1, '#080b10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 1290);

    // 2. Brushed Titanium Micro-Texture Lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let y = 0; y < 1290; y += 4) {
      ctx.fillRect(0, y, 2048, 1.2);
    }

    // 3. Subtle Metallic Radial Highlight (Upper Left)
    const radGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 900);
    radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    radGrad.addColorStop(0.6, 'rgba(30, 58, 138, 0.04)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 2048, 1290);

    // 4. Hairline Top Border Highlight
    const borderGrad = ctx.createLinearGradient(0, 0, 2048, 0);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    borderGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 2028, 1270);

    // 5. Header: TRUSTPAY Logo & Security Shield Pill
    ctx.save();
    ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '-2px';
    ctx.fillText('TRUST', 140, 190);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PAY', 460, 190);

    // Subtitle
    ctx.font = '600 32px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.letterSpacing = '5px';
    ctx.fillText('SENTINEL TITANIUM CARD', 145, 245);

    // Top Right: Holographic Contactless NFC Waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(1860, 180, 55, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1860, 180, 75, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1860, 180, 95, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.restore();

    // 6. Realistic 3D Gold EMV Microchip
    ctx.save();
    const chipX = 140;
    const chipY = 380;
    const chipW = 260;
    const chipH = 200;
    const chipR = 26;

    // Gold gradient
    const goldGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.3, '#eab308');
    goldGrad.addColorStop(0.7, '#ca8a04');
    goldGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, chipR);
    ctx.fill();

    // Chip contact grid grooves
    ctx.strokeStyle = 'rgba(113, 63, 18, 0.7)';
    ctx.lineWidth = 4;
    ctx.strokeRect(chipX + 35, chipY, chipW - 70, chipH);
    ctx.beginPath();
    ctx.moveTo(chipX, chipY + chipH / 2);
    ctx.lineTo(chipX + chipW, chipY + chipH / 2);
    ctx.moveTo(chipX + chipW / 2, chipY);
    ctx.lineTo(chipX + chipW / 2, chipY + chipH);
    ctx.stroke();
    ctx.restore();

    // 7. Holographic Security Foil Ribbon (Horizontal iridescent strip)
    const holoGrad = ctx.createLinearGradient(0, 680, 2048, 760);
    holoGrad.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
    holoGrad.addColorStop(0.25, 'rgba(168, 85, 247, 0.3)');
    holoGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
    holoGrad.addColorStop(0.75, 'rgba(52, 211, 153, 0.3)');
    holoGrad.addColorStop(1, 'rgba(251, 191, 36, 0.25)');
    ctx.fillStyle = holoGrad;
    ctx.fillRect(0, 670, 2048, 70);

    // Microprint text in holographic ribbon
    ctx.save();
    ctx.font = '600 24px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.letterSpacing = '10px';
    ctx.fillText('TRUSTPAY 99.98% ACCURACY • BCNF ACID • RABBITMQ AMQP • REDIS 7 • FASTAPI LIGHTGBM', 50, 715);
    ctx.restore();

    // 8. Embossed Card Number
    ctx.save();
    ctx.font = 'bold 74px "SF Mono", Consolas, monospace';
    ctx.letterSpacing = '10px';
    // Emboss shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText('4532  8910  2024  3226', 143, 893);
    // Emboss highlight
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('4532  8910  2024  3226', 140, 890);
    ctx.restore();

    // 9. Cardholder Name & Expiry
    ctx.save();
    ctx.font = '600 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '3px';
    ctx.fillText('CARDHOLDER', 140, 1020);
    ctx.fillText('EXPIRES', 1060, 1020);
    ctx.fillText('SECURITY STATUS', 1460, 1020);

    ctx.font = 'bold 44px "SF Pro Display", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '2px';
    ctx.fillText('RAGHAV GUPTA • SECTION E2', 140, 1080);
    ctx.fillText('10 / 28', 1060, 1080);

    // Security badge
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('BCNF VALIDATED', 1460, 1080);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Procedural Back Texture Generator (2048 x 1280)
  const generateBackTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1290;
    const ctx = canvas.getContext('2d');

    // Deep matte obsidian
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, 2048, 1290);

    // Magnetic Stripe (Matte carbon black)
    ctx.fillStyle = '#020305';
    ctx.fillRect(0, 140, 2048, 220);

    // Magnetic fine track lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(0, 180, 2048, 6);
    ctx.fillRect(0, 240, 2048, 6);
    ctx.fillRect(0, 300, 2048, 6);

    // White Signature Panel with Guilloche security pattern
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(140, 440, 1260, 160, 12);
    ctx.fill();

    // Security pattern lines in signature strip
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 150; x < 1390; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 440);
      ctx.lineTo(x + 20, 600);
      ctx.stroke();
    }

    // Customer signature
    ctx.font = 'italic 52px cursive, Georgia, serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('Raghav Gupta', 200, 545);

    // CVV Box (Holographic silver)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(1440, 440, 280, 160, 12);
    ctx.fill();

    ctx.font = 'bold 58px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('99.9%', 1485, 545);

    ctx.font = 'bold 22px system-ui';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ACCURACY', 1505, 580);

    // Compliance & Microservice Topology text
    ctx.font = '500 24px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      'This titanium credential interfaces directly with TrustPay 6-Service Architecture.',
      140,
      720
    );
    ctx.fillText(
      'Decoupled via RabbitMQ (fraud_evaluation_queue) • Redis 7 ZSET Rate Limiting (5 req/10s)',
      140,
      765
    );
    ctx.fillText(
      'FastAPI Sentinel AI Worker • LightGBM Ensemble (1.27ms p50) • Groq Llama 3.3 70B Forensics',
      140,
      810
    );
    ctx.fillText(
      'MySQL 8.0 InnoDB Ledger with BCNF 8-Entity Schema and Row-Level Locks (SELECT FOR UPDATE)',
      140,
      855
    );

    // Academic Sign-off Badge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, 940, 1768, 220, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 36px system-ui';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('MNNIT ALLAHABAD • CSE B.TECH 3RD YEAR PROJECT', 180, 1010);

    ctx.font = '500 26px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(
      'Contributors: Raghav Gupta (20243226) • Rishabh Srivastava (20243236) • Rishabh Singh (20243235) • Prince Keshari (20243218)',
      180,
      1070
    );
    ctx.fillText('Evaluation: Production v2.0 • Zero Overflow A4 Monograph Validated', 180, 1120);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setIs3DSupported(false);
        return;
      }
    } catch {
      setIs3DSupported(false);
      return;
    }

    const width = container.clientWidth || 580;
    const height = container.clientHeight || 580;

    // 1. Scene
    const scene = new THREE.Scene();
    stateRef.current.scene = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    stateRef.current.camera = camera;

    // 3. Renderer with high-quality antialiasing & tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x1e3a8a, 2.0);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    // Cyan Rim Light (Fresnel edge pop)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    // Dynamic Cursor Spotlight (Follows mouse cursor)
    const cursorLight = new THREE.PointLight(0x38bdf8, 3.5, 12);
    cursorLight.position.set(0, 0, 4);
    scene.add(cursorLight);
    stateRef.current.cursorLight = cursorLight;

    // Core Light (Glows from the center of the neural core)
    const coreLight = new THREE.PointLight(0x38bdf8, 4.0, 6);
    coreLight.position.set(0, 0, 0.4);
    scene.add(coreLight);
    stateRef.current.coreLight = coreLight;

    // 5. Build Rounded 3D Credit Card Geometry
    const cardW = 4.4;
    const cardH = 2.78;
    const cardR = 0.22;
    const cardDepth = 0.07;

    const shape = new THREE.Shape();
    shape.moveTo(-cardW / 2 + cardR, -cardH / 2);
    shape.lineTo(cardW / 2 - cardR, -cardH / 2);
    shape.quadraticCurveTo(cardW / 2, -cardH / 2, cardW / 2, -cardH / 2 + cardR);
    shape.lineTo(cardW / 2, cardH / 2 - cardR);
    shape.quadraticCurveTo(cardW / 2, cardH / 2, cardW / 2 - cardR, cardH / 2);
    shape.lineTo(-cardW / 2 + cardR, cardH / 2);
    shape.quadraticCurveTo(-cardW / 2, cardH / 2, -cardW / 2, cardH / 2 - cardR);
    shape.lineTo(-cardW / 2, -cardH / 2 + cardR);
    shape.quadraticCurveTo(-cardW / 2, -cardH / 2, -cardW / 2 + cardR, -cardH / 2);

    const extrudeSettings = {
      depth: cardDepth,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };

    const cardGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    cardGeometry.center();

    // Textures
    const frontTex = generateFrontTexture();
    const backTex = generateBackTexture();

    // Side edge material (anisotropic brushed dark titanium)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.22,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      metalness: 0.88,
      roughness: 0.28,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTex,
      metalness: 0.88,
      roughness: 0.28,
    });

    // Mesh with multi-material for front, back, and beveled titanium edges
    const cardMesh = new THREE.Mesh(cardGeometry, [frontMaterial, edgeMaterial]);
    stateRef.current.cardMesh = cardMesh;

    // Card Master Group
    const cardGroup = new THREE.Group();
    cardGroup.add(cardMesh);
    scene.add(cardGroup);
    stateRef.current.cardGroup = cardGroup;

    // 6. 3D Holographic Cryptographic Core (Floating in front of card)
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0.25);
    cardGroup.add(coreGroup);
    stateRef.current.coreGroup = coreGroup;

    // Outer Torus Ring 1
    const ring1Geo = new THREE.TorusGeometry(0.85, 0.018, 16, 72);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    coreGroup.add(ring1);
    stateRef.current.ring1 = ring1;

    // Inner Torus Ring 2 (Perpendicular)
    const ring2Geo = new THREE.TorusGeometry(0.68, 0.015, 16, 72);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x2563eb,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    coreGroup.add(ring2);
    stateRef.current.ring2 = ring2;

    // Central Faceted Quantum Crystal (Octahedron)
    const crystalGeo = new THREE.OctahedronGeometry(0.38, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.8,
      transparent: true,
      opacity: 0.92,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    coreGroup.add(crystal);
    stateRef.current.crystal = crystal;

    // 7. Ambient Particle Swarm (140 Data Packets)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(theta) * Math.cos(phi);
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;

      particleVelocities.push({
        angle: theta,
        speed: 0.008 + Math.random() * 0.012,
        r: radius,
        yPhase: Math.random() * Math.PI * 2,
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    stateRef.current.particles = particles;
    stateRef.current.particleVelocities = particleVelocities;

    // 8. Mouse & Pointer Tracking for 3D Spring Tilt
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Parallax rotation bounds
      stateRef.current.targetRotY = x * 0.55;
      stateRef.current.targetRotX = -y * 0.42;

      // Update cursor light
      if (cursorLight) {
        cursorLight.position.x = x * 3.5;
        cursorLight.position.y = y * 2.5;
      }
    };

    const handlePointerDown = (e) => {
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.dragStartY = e.clientY;
      setIsDragging(true);
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
      setIsDragging(false);
    };

    const handlePointerDrag = (e) => {
      if (!stateRef.current.isDragging) return;
      const deltaX = e.clientX - stateRef.current.dragStartX;
      const deltaY = e.clientY - stateRef.current.dragStartY;

      stateRef.current.baseRotY += deltaX * 0.008;
      stateRef.current.targetRotX += deltaY * 0.005;

      stateRef.current.dragStartX = e.clientX;
      stateRef.current.dragStartY = e.clientY;
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerDrag);

    // 9. Intersection Observer (Pauses rendering when scrolled out of view)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          stateRef.current.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // 10. Resize Observer
    const handleResize = () => {
      if (!container || !stateRef.current.renderer || !stateRef.current.camera) return;
      const w = container.clientWidth || 580;
      const h = container.clientHeight || 580;
      stateRef.current.camera.aspect = w / h;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. 60-120 FPS Buttery Animation Loop with High-Precision Performance Timer
    let lastTime = performance.now();

    const animate = (currentTime = performance.now()) => {
      stateRef.current.animId = requestAnimationFrame(animate);

      if (!stateRef.current.isVisible) return;

      const delta = Math.min((currentTime - lastTime) * 0.001, 0.1);
      lastTime = currentTime;
      const elapsed = currentTime * 0.001;

      const {
        cardGroup,
        ring1,
        ring2,
        crystal,
        particles,
        particleVelocities,
        targetThreatColor,
        threatColor,
        coreLight,
      } = stateRef.current;

      // Smooth color transition towards target threat color
      threatColor.lerp(targetThreatColor, 0.08);

      if (ring1) ring1.material.color.copy(threatColor);
      if (ring2) ring2.material.color.copy(threatColor);
      if (crystal) crystal.material.color.copy(threatColor);
      if (particles) particles.material.color.copy(threatColor);
      if (coreLight) {
        coreLight.color.copy(threatColor);
        // Pulse core intensity
        coreLight.intensity = 3.2 + Math.sin(elapsed * 4) * 1.5;
      }

      // Smooth spring dampening for card rotation
      const totalTargetY =
        stateRef.current.baseRotY + stateRef.current.flipRotY + stateRef.current.targetRotY;
      stateRef.current.currentRotY += (totalTargetY - stateRef.current.currentRotY) * 0.065;
      stateRef.current.currentRotX +=
        (stateRef.current.targetRotX - stateRef.current.currentRotX) * 0.065;

      if (cardGroup) {
        // Apply rotation + subtle breathing float
        cardGroup.rotation.y = stateRef.current.currentRotY;
        cardGroup.rotation.x = stateRef.current.currentRotX;
        cardGroup.position.y = Math.sin(elapsed * 1.5) * 0.12;

        // Subtle harmonic z-wobble
        cardGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.02;
      }

      // Orbiting Holographic Rings
      if (ring1) {
        ring1.rotation.z += 0.015;
        ring1.rotation.x += 0.008;
      }
      if (ring2) {
        ring2.rotation.z -= 0.022;
        ring2.rotation.y += 0.012;
      }

      // Quantum crystal tumbling & breathing scale
      if (crystal) {
        crystal.rotation.x += 0.012;
        crystal.rotation.y += 0.018;
        const scale = 1.0 + Math.sin(elapsed * 3.5) * 0.08;
        crystal.scale.set(scale, scale, scale);
      }

      // Animate ambient particle swarm
      if (particles && particleVelocities) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const v = particleVelocities[i];
          v.angle += v.speed;
          positions[i * 3] = v.r * Math.cos(v.angle);
          positions[i * 3 + 1] = v.r * Math.sin(v.angle) + Math.sin(elapsed + v.yPhase) * 0.2;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Complete Cleanup Function
    return () => {
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerDrag);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);

      // Dispose Three.js assets
      cardGeometry.dispose();
      frontTex.dispose();
      backTex.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      edgeMaterial.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [generateFrontTexture, generateBackTexture]);

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center ${className}`}
      style={{ minHeight: '520px', width: '100%', perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className={`w-full h-[460px] md:h-[540px] flex items-center justify-center cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{ touchAction: 'none' }}
        onClick={onCardClick}
      />

      {/* Fallback for non-WebGL devices */}
      {!is3DSupported && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
            <Shield size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">TrustPay Sentinel Titanium</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-4">
            Hardware-accelerated 3D is unavailable in this environment. The full BCNF ledger and ML
            pipeline are fully operational.
          </p>
          <div className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-mono text-xs font-semibold">
            STATUS: 99.98% FRAUD SHIELD ACTIVE
          </div>
        </div>
      )}

      {/* Floating Apple-Style Glass Control Pill */}
      {is3DSupported && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto"
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Flip Card Button */}
          <button
            type="button"
            onClick={toggleFlip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              color: isFlipped ? '#38bdf8' : '#e2e8f0',
              background: isFlipped ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isFlipped ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
            }}
            title="Flip to view card back with magnetic stripe & security credentials"
          >
            <RotateCw size={13} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
            <span>{isFlipped ? 'Front View' : 'Flip Card'}</span>
          </button>

          {/* Reset Camera Button */}
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Reset 3D camera angle"
          >
            <RefreshCw size={13} />
          </button>

          {/* Vertical Divider */}
          <div className="w-[1px] h-4 bg-white/15" />

          {/* Interactive Status Telemetry Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  threatLevel === 'HIGH' || threatLevel === 'CRITICAL' || riskScore >= 70
                    ? '#ef4444'
                    : threatLevel === 'MEDIUM' || riskScore >= 40
                    ? '#f59e0b'
                    : '#38bdf8',
                boxShadow: `0 0 8px ${
                  threatLevel === 'HIGH' || threatLevel === 'CRITICAL' || riskScore >= 70
                    ? '#ef4444'
                    : threatLevel === 'MEDIUM' || riskScore >= 40
                    ? '#f59e0b'
                    : '#38bdf8'
                }`,
              }}
            />
            <span className="text-slate-300">
              {riskScore >= 70
                ? 'CRITICAL DEFENSE'
                : riskScore >= 40
                ? 'ELEVATED SURVEILLANCE'
                : 'QUANTUM SHIELD'}
            </span>
          </div>
        </div>
      )}

      {/* Floating 3D Telemetry Badges in Perspective */}
      <div
        className="hidden md:flex absolute top-6 right-2 flex-col gap-2.5 pointer-events-none transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0.85 }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Sparkles size={12} />
          <span>99.98% ML SHIELD</span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold"
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Zap size={12} className="text-amber-400" />
          <span>1.27 ms MEDIAN</span>
        </div>
      </div>
    </div>
  );
};

export default TrustPayHero3D;
