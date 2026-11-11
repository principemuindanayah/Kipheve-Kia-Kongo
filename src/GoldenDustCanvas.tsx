import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseVx: number;
  baseVy: number;
  color: string;
  baseAlpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  sparkleThreshold: number;
}

const GOLD_PALETTE = [
  '#FFFAC4', // Ouro Luminoso Imperial
  '#F0C63E', // Ouro Radiante Kongo
  '#D4AF37', // Ouro Imperial Tradicional
  '#E5C158', // Ouro Ancestral
  '#DFBE91'  // Ouro Basalto Ambarino
];

export const GoldenDustCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId: number;

    // Forças de inércia do giroscópio (e fallback para rato em desktop)
    let targetForceX = 0;
    let targetForceY = 0;
    let currentForceX = 0;
    let currentForceY = 0;

    const PARTICLE_COUNT = 60;
    let particles: Particle[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.8 + Math.random() * 2.0,
          baseVx: (Math.random() - 0.5) * 0.25,
          baseVy: -(0.25 + Math.random() * 0.45), // Flutuação ascendente suave
          color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
          baseAlpha: 0.25 + Math.random() * 0.65,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.035,
          sparkleThreshold: 0.78 + Math.random() * 0.15
        });
      }
    };

    resize();
    initParticles();

    // 1. Deteção do sensor giroscópio (DeviceOrientation)
    let hasGyro = false;
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        hasGyro = true;
        // gamma: inclinação lateral (esquerda -45° a +45°)
        // beta: inclinação vertical (posição usual das mãos ~40-50°)
        const clampedGamma = Math.max(-45, Math.min(45, e.gamma));
        const clampedBeta = Math.max(-45, Math.min(45, e.beta - 45));

        targetForceX = (clampedGamma / 45) * 1.8;
        targetForceY = (clampedBeta / 45) * 1.5;
      }
    };

    // 2. Fallback de interação com cursor para desktops/laptops
    const handleMouseMove = (e: MouseEvent) => {
      if (hasGyro) return;
      const normX = (e.clientX / width) - 0.5;
      const normY = (e.clientY / height) - 0.5;
      targetForceX = normX * 1.6;
      targetForceY = normY * 1.4;
    };

    const handleResize = () => {
      resize();
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Loop de renderização 60FPS com interpolação suave
    let isRunning = true;
    const render = () => {
      if (!isRunning) return;

      // Interpolação de inércia para evitar solavancos ou jitter
      currentForceX += (targetForceX - currentForceX) * 0.05;
      currentForceY += (targetForceY - currentForceY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Atualização da posição com efeito parallax baseado no tamanho da partícula
        const massFactor = p.size / 1.5;
        p.x += p.baseVx + currentForceX * massFactor;
        p.y += p.baseVy + currentForceY * massFactor;

        // Pulsação de brilho (cintilação de poeira de ouro)
        p.pulsePhase += p.pulseSpeed;
        const shimmer = 0.55 + 0.45 * Math.sin(p.pulsePhase);
        const currentAlpha = Math.max(0.08, Math.min(1, p.baseAlpha * shimmer));

        // Reaparecimento contínuo nas bordas do ecrã
        const margin = 20;
        if (p.x < -margin) p.x = width + margin;
        if (p.x > width + margin) p.x = -margin;
        if (p.y < -margin) p.y = height + margin;
        if (p.y > height + margin) p.y = -margin;

        // Desenhar a partícula com brilho etéreo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = p.size > 1.5 ? 9 : 5;
        ctx.fill();

        // Cintilação especial em cruz dourada para partículas maiores no ápice do brilho
        if (p.size >= 1.6 && shimmer > p.sparkleThreshold) {
          const crossLen = p.size * 2.2;
          ctx.strokeStyle = '#FFFAC4';
          ctx.lineWidth = 0.7;
          ctx.globalAlpha = currentAlpha * 0.85;

          ctx.beginPath();
          ctx.moveTo(p.x - crossLen, p.y);
          ctx.lineTo(p.x + crossLen, p.y);
          ctx.moveTo(p.x, p.y - crossLen);
          ctx.lineTo(p.x, p.y + crossLen);
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Poupança de bateria: pausa quando a janela está em segundo plano
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      id="canvasPoeiraOuro"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.92
      }}
    />
  );
};
