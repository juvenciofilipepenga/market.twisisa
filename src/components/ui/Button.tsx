import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary: "border border-border bg-elevated text-ink hover:border-ink-faint",
  ghost: "bg-transparent text-ink-muted hover:bg-elevated hover:text-ink",
  danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20",
  light: "bg-white text-primary-active hover:bg-ink"
};
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-5 text-[15px]",
  icon: "h-10 w-10 rounded-xl"
};

// Mesmo visual para <button> e para <Link>: <Link className={buttonClass("primary", "lg")}>
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return `press relative inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 data-[loading=true]:cursor-progress data-[loading=true]:opacity-100 ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Estado de carregamento controlado (ex.: submissão de formulário). */
  loading?: boolean;
  /** Se devolver uma Promise, o botão mostra o spinner e fica bloqueado até ela terminar. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => unknown;
  children: ReactNode;
}

// Regra do projecto: todo o botão que dispara algo que pode demorar mostra spinner. Aqui isso é
// automático: basta passar uma função async ao onClick (ou `loading` num submit). O texto mantém
// o espaço (invisible), por isso o botão não muda de largura nem "salta".
export function Button({ variant = "primary", size = "md", loading = false, onClick, disabled, className = "", children, type = "button", ...rest }: Props) {
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const isLoading = loading || busy;

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!onClick || isLoading) return;
    const result = onClick(e);
    if (result instanceof Promise) {
      setBusy(true);
      result.catch((err) => console.error(err)).finally(() => { if (alive.current) setBusy(false); });
    }
  }

  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || isLoading}
      data-loading={isLoading}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className={`inline-flex items-center justify-center gap-2 ${isLoading ? "invisible" : ""}`}>{children}</span>
      {isLoading && <span className="absolute inset-0 flex items-center justify-center"><Spinner size={size === "lg" ? 20 : 18} /></span>}
    </button>
  );
}
