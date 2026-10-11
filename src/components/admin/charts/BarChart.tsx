import { useState } from "react";

export interface BarPoint { label: string; value: number; sub?: string }

// Gráfico de barras verticais em SVG puro: eixos com valores, grelha, e o valor de cada dia ao tocar.
// Sem bibliotecas (nada a instalar, leve no telemóvel).
export function BarChart({ points, format = (n) => String(n), height = 170, ariaLabel }: { points: BarPoint[]; format?: (n: number) => string; height?: number; ariaLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 600, H = height, padL = 34, padR = 6, padTop = 12, padBottom = 22;
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  // Eixo "limpo": arredonda o máximo para cima (1, 2, 5 × 10^k) para os números do eixo serem redondos.
  const nice = (() => { const pow = 10 ** Math.floor(Math.log10(max)); const f = max / pow; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow; })();
  const slot = (W - padL - padR) / Math.max(1, n);
  const barW = Math.max(2, slot * 0.64);
  const y = (v: number) => padTop + (1 - v / nice) * (H - padTop - padBottom);
  const shown = active ?? (n ? n - 1 : null);
  const cur = shown !== null ? points[shown] : undefined;
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const ticks = [0, nice / 2, nice];

  return (
    <div>
      <div className="mb-2 flex min-h-[2.25rem] items-baseline justify-between gap-3">
        <p className="font-display text-2xl font-extrabold tabular-nums leading-none">{cur ? format(cur.value) : "—"}</p>
        <p className="text-xs text-ink-faint">{cur ? `${cur.label}${cur.sub ? ` · ${cur.sub}` : ""}` : ""}</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block h-auto w-full touch-pan-y select-none"
        onPointerLeave={() => setActive(null)}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setActive(Math.min(n - 1, Math.max(0, Math.floor((px - padL) / slot))));
        }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="rgb(var(--c-border, 53 42 41))" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "3 4"} opacity={t === 0 ? 0.9 : 0.5} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const top = y(p.value);
          const h = Math.max(p.value > 0 ? 2 : 0, H - padBottom - top);
          return (
            <g key={i}>
              <rect x={x} y={H - padBottom - h} width={barW} height={h} rx={Math.min(4, barW / 2)} fill="rgb(var(--c-primary))" opacity={shown === i ? 1 : 0.55} />
              {i % labelEvery === 0 && <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">{p.label}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
