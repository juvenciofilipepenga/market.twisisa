import { useId, useState } from "react";

export interface AreaPoint { label: string; value: number; sub?: string }

// Gráfico de área em SVG puro (sem bibliotecas: nada a instalar, funciona no Termux).
// Toque/rato num ponto mostra o valor desse dia. Cor = cor de destaque do painel.
export function AreaChart({ points, format, height = 180, ariaLabel }: { points: AreaPoint[]; format: (n: number) => string; height?: number; ariaLabel: string }) {
  const gid = useId();
  const [active, setActive] = useState<number | null>(null);
  const W = 600, H = height, padX = 8, padTop = 14, padBottom = 22;
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const x = (i: number) => padX + (n <= 1 ? (W - padX * 2) / 2 : (i * (W - padX * 2)) / (n - 1));
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = n ? `${line} L${x(n - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z` : "";
  const shown = active ?? (n ? n - 1 : null);
  const cur = shown !== null ? points[shown] : undefined;
  const labelEvery = Math.max(1, Math.ceil(n / 6));

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
          const ratio = (e.clientX - r.left) / (r.width || 1);
          setActive(Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1)))));
        }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--c-primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="rgb(var(--c-primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => <line key={g} x1={padX} x2={W - padX} y1={padTop + g * (H - padTop - padBottom)} y2={padTop + g * (H - padTop - padBottom)} stroke="currentColor" className="text-border" strokeDasharray="3 5" />)}
        {n > 0 && <path d={area} fill={`url(#${gid})`} />}
        {n > 0 && <path d={line} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        {shown !== null && cur && (
          <>
            <line x1={x(shown)} x2={x(shown)} y1={padTop} y2={H - padBottom} stroke="currentColor" className="text-ink-faint" strokeDasharray="2 4" />
            <circle cx={x(shown)} cy={y(cur.value)} r="5" fill="rgb(var(--c-primary))" stroke="#140F0E" strokeWidth="2" />
          </>
        )}
        {points.map((p, i) => i % labelEvery === 0 || i === n - 1 ? (
          <text key={p.label} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-ink-faint" fontSize="11">{p.label}</text>
        ) : null)}
      </svg>
    </div>
  );
}
