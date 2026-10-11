import type { ReactNode } from "react";

// Cartão numerado do formulário: o administrador percorre 7 passos curtos em vez de uma lista comprida de campos.
export function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4" aria-labelledby={`sec-${n}`}>
      <div className="mb-3 flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{n}</span>
        <div className="min-w-0">
          <h3 id={`sec-${n}`} className="text-sm font-bold">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const inputCls = "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-base focus:border-primary focus:outline-none sm:text-sm";

export function Labeled({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-muted">{label}{required && <span className="text-danger"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-sm font-semibold">{label}</p>{help && <p className="text-xs text-ink-muted">{help}</p>}</div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`press relative h-8 w-14 shrink-0 rounded-full border transition-colors ${checked ? "border-success bg-success" : "border-border bg-elevated"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${checked ? "left-[1.625rem]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
