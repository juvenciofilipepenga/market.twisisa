import type { ReactNode } from "react";
import { Skeleton } from "../ui/Skeleton";

export function StatCard({ label, value, icon }: { label: string; value: number | null; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">{label}</p>
        <div className="text-primary-text">{icon}</div>
      </div>
      {value === null ? <Skeleton className="mt-3 h-9 w-14" /> : <p className="mt-2 font-display text-4xl font-extrabold leading-none">{value}</p>}
    </div>
  );
}
