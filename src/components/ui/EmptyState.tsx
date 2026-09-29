import type { ReactNode } from "react";

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <p className="text-sm font-medium text-ink-muted">{title}</p>
      {description && <p className="text-xs text-ink-faint">{description}</p>}
    </div>
  );
}
