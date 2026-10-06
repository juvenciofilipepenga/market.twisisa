export interface DonutSlice { key: string; label: string; value: number; color: string }

// Rosca em SVG: cada fatia é um arco (stroke-dasharray). A legenda é texto real (acessível e legível no telemóvel).
export function Donut({ slices, centerLabel, empty }: { slices: DonutSlice[]; centerLabel: string; empty: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-ink-faint">{empty}</p>;
  const R = 52, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeWidth="16" className="text-elevated" />
        {slices.map((s) => {
          const len = (s.value / total) * C;
          const el = <circle key={s.key} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
        <g className="rotate-90" style={{ transformOrigin: "70px 70px" }}>
          <text x="70" y="70" textAnchor="middle" className="fill-ink" fontSize="24" fontWeight="800">{total}</text>
          <text x="70" y="88" textAnchor="middle" className="fill-ink-faint" fontSize="10">{centerLabel}</text>
        </g>
      </svg>
      <ul className="grid w-full flex-1 grid-cols-1 gap-x-4 gap-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-ink-muted"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} /><span className="truncate">{s.label}</span></span>
            <span className="font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
