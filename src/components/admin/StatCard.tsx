import type { ReactNode } from "react";
import { Skeleton } from "../ui/Skeleton";

export function StatCard({ label, value, icon }: { label: string; value: number | null; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        {value === null ? <Skeleton className="mt-1 h-6 w-10" /> : <p className="text-xl font-bold">{value}</p>}
      </div>
    </div>
  );
}
