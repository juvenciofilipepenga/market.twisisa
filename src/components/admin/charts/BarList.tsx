// Barras horizontais com rótulo e valor: legíveis em ecrãs estreitos (o texto nunca fica dentro da barra).
export interface BarItem { key: string; label: string; value: number; display: string; color?: string }

export function BarList({ items, empty }: { items: BarItem[]; empty: string }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-ink-faint">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink-muted">{item.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{item.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elevated" role="presentation">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(3, (item.value / max) * 100)}%`, background: item.color ?? "rgb(var(--c-primary))" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
