import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckIcon, XIcon } from "../icons";

interface ToastOptions {
  tone?: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
  duration?: number;
}
interface ToastItem extends ToastOptions { id: number; message: string }
interface ToastContextValue { show: (message: string, options?: ToastOptions) => void }

const ToastContext = createContext<ToastContextValue | null>(null);
let nextId = 1;

// Avisos curtos e com acção ("Adicionado ao carrinho · Ver carrinho", "Removido · Desfazer").
// Ficam em baixo, acima da barra segura do telemóvel; --toast-offset sobe-os quando há uma barra fixa.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    const id = nextId++;
    setItems((prev) => [...prev.filter((i) => i.message !== message).slice(-2), { id, message, ...options }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), options.duration ?? (options.action ? 5000 : 3000)));
  }, [dismiss]);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-[80] flex flex-col items-center gap-2 px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--toast-offset, 16px))" }}
      >
        {items.map((item) => (
          <div key={item.id} className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-elevated py-2.5 pl-4 pr-2 shadow-xl shadow-black/50">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.tone === "error" ? "bg-danger/15 text-danger" : "bg-success/15 text-success"}`}>
              {item.tone === "error" ? <XIcon width={14} height={14} /> : <CheckIcon width={14} height={14} />}
            </span>
            <p className="min-w-0 flex-1 text-sm">{item.message}</p>
            {item.action && (
              <button onClick={() => { item.action?.onClick(); dismiss(item.id); }} className="press h-9 shrink-0 rounded-lg px-3 text-sm font-bold text-primary-text hover:bg-bg/40">
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Barras fixas em baixo (compra no produto, total no carrinho) chamam isto para o aviso não ficar por baixo delas.
export function useBottomBarOffset(active: boolean, heightPx = 88) {
  useEffect(() => {
    if (!active) return;
    document.documentElement.style.setProperty("--toast-offset", `${heightPx + 8}px`);
    return () => { document.documentElement.style.removeProperty("--toast-offset"); };
  }, [active, heightPx]);
}
