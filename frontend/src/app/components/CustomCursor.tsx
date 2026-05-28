import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function CustomCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isClickingRef = useRef(false);

  // Generador de Partículas de Spray Mágico
  const spawnSpray = (x: number, y: number, count: number) => {
    // Paleta de colores mágica: neones y tonos de Infinity Barber
    const colors = [
      "rgba(168, 85, 247, ",  // Violeta
      "rgba(236, 72, 153, ",  // Rosa neón
      "rgba(6, 182, 212, ",   // Cyan
      "rgba(99, 102, 241, ",  // Índigo
      "rgba(255, 255, 255, ", // Blanco mágico
    ];

    for (let i = 0; i < count; i++) {
      // Dispersión radial tipo spray/polvo mágico
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      
      particlesRef.current.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // Flota ligeramente hacia arriba
        size: Math.random() * 3.5 + 1.2, // Tamaño más visible
        alpha: Math.random() * 0.6 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      // Spawnea una ráfaga mágica visible al mover el cursor (6 partículas por movimiento)
      spawnSpray(e.clientX, e.clientY, 6);
    };

    const handleMouseDown = () => {
      isClickingRef.current = true;
      // Generar una explosión mágica concentrada al hacer clic (25 partículas)
      spawnSpray(mouseRef.current.x, mouseRef.current.y, 25);
    };

    const handleMouseUp = () => {
      isClickingRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY };
        isClickingRef.current = true;
        spawnSpray(touch.clientX, touch.clientY, 20);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY };
        spawnSpray(touch.clientX, touch.clientY, 4);
      }
    };

    const handleTouchEnd = () => {
      isClickingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Render Loop del Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // Loop a 60 FPS
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Si se mantiene presionado el clic, expulsa spray continuo
      if (isClickingRef.current) {
        spawnSpray(mouseRef.current.x, mouseRef.current.y, 2);
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.016; // Desvanecimiento suave
        p.size *= 0.965;  // Encogimiento gradual

        if (p.alpha <= 0 || p.size <= 0.3) {
          particles.splice(i, 1);
          continue;
        }

        // Estilo de partículas: brillo circular difuminado
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color.includes("255") ? "rgba(255,255,255,0.5)" : "rgba(139,92,246,0.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[999999] h-full w-full"
    />
  );
}
