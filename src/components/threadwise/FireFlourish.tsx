import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  warm: number;
};

/** A continuous 2D ember line beneath the signature. */
export function FireFlourish() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let last = performance.now();

    const baseline = (x: number) => {
      const t = width ? x / width : 0;
      return height * 0.72 + Math.sin(t * Math.PI * 2.7 + 0.8) * height * 0.055;
    };

    const spawn = (randomY = false): Particle => {
      const maxLife = 0.7 + Math.random() * 0.9;
      return {
        x: Math.random() * width,
        y: baseline(Math.random() * width) + (randomY ? -Math.random() * height * 0.5 : 0),
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(0.22 + Math.random() * 0.62),
        life: maxLife,
        maxLife,
        size: 1.2 + Math.random() * 3.4,
        warm: Math.random(),
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width > 500 ? 46 : 28;
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const drawLine = (time: number) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(111,28,8,0.25)");
      gradient.addColorStop(0.16, "#C93E12");
      gradient.addColorStop(0.43, "#F06A18");
      gradient.addColorStop(0.62, "#FFB84E");
      gradient.addColorStop(0.8, "#F06A18");
      gradient.addColorStop(1, "rgba(111,28,8,0.25)");

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = baseline(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(226,79,24,0.18)";
      ctx.lineWidth = 7;
      ctx.shadowColor = "rgba(228,91,30,0.58)";
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = baseline(x) - Math.sin(time * 0.0012 + x * 0.018) * 0.7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.7;
      ctx.shadowBlur = 7;
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = baseline(x) - Math.sin(time * 0.0012 + x * 0.018) * 0.7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(255,226,168,0.82)";
      ctx.lineWidth = 0.55;
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();
    };

    const drawParticles = () => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        const alpha = Math.max(0, particle.life / particle.maxLife);
        const radius = particle.size * (0.55 + alpha * 0.75);
        const x = particle.x + Math.sin(particle.life * 9 + particle.warm * 8) * 1.2;
        const y = particle.y;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        if (particle.warm > 0.62) {
          gradient.addColorStop(0, `rgba(255,239,190,${alpha * 0.9})`);
          gradient.addColorStop(0.3, `rgba(255,184,78,${alpha * 0.72})`);
          gradient.addColorStop(1, "rgba(201,62,18,0)");
        } else if (particle.warm > 0.28) {
          gradient.addColorStop(0, `rgba(255,174,79,${alpha * 0.8})`);
          gradient.addColorStop(0.45, `rgba(240,106,24,${alpha * 0.55})`);
          gradient.addColorStop(1, "rgba(160,44,12,0)");
        } else {
          gradient.addColorStop(0, `rgba(214,78,26,${alpha * 0.55})`);
          gradient.addColorStop(1, "rgba(111,28,8,0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const animate = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      drawLine(now);
      if (!reduceMotion) {
        for (const particle of particles) {
          particle.life -= delta;
          if (particle.life <= 0) Object.assign(particle, spawn());
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;
        }
      }
      drawParticles();
      if (!reduceMotion) frame = window.requestAnimationFrame(animate);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="fire-flourish" aria-hidden="true" />;
}
