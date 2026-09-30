import { useEffect, useRef, useState } from "react";

const COLORS = ["#EE0006", "#FF6259", "#FFC145", "#F8F2ED"];

interface Piece { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; color: string }

// Momento de celebração (encomenda criada). Desenha ~2 s e desaparece; não faz nada com prefers-reduced-motion.
export function Confetti({ duration = 2200 }: { duration?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDone(true); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { setDone(true); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const count = w < 640 ? 70 : 110;
    const pieces: Piece[] = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 9 + Math.random() * 9;
      return {
        x: w / 2 + (Math.random() - 0.5) * 80, y: h * 0.38,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? "#EE0006"
      };
    });

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      const fade = Math.max(0, Math.min(1, (duration - elapsed) / 500));
      for (const p of pieces) {
        p.vy += 0.32; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick); else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  if (done) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85] h-full w-full" />;
}
