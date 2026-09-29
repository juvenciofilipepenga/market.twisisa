import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-40",
  secondary: "bg-elevated text-ink border border-border hover:border-primary/50 disabled:opacity-40",
  ghost: "bg-transparent text-ink-muted hover:text-ink disabled:opacity-40",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 disabled:opacity-40"
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
