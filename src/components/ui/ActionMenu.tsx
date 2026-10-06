import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  key: string;
  label: string;
  onSelect: () => void;
  /** Acção destrutiva: vermelha e separada das outras. */
  danger?: boolean;
  disabled?: boolean;
}

// Menu "⋯": põe várias acções atrás de UM botão com área de toque de 40 px (em vez de 3-4 botões miúdos por linha).
// Teclado: Enter/Espaço abre, ↑/↓ percorrem, Esc fecha e devolve o foco. Perto do fundo do ecrã abre para cima
// (a barra inferior do telemóvel não tapa o menu).
export function ActionMenu({ label, items, trigger }: { label: string; items: MenuItem[]; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function toggle() {
    if (!open && root.current) {
      const rect = root.current.getBoundingClientRect();
      setUp(window.innerHeight - rect.bottom < 96 + items.length * 48);
    }
    setOpen((value) => !value);
  }

  useEffect(() => {
    if (!open) return;
    const menuItems = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
    menuItems()[0]?.focus();
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = menuItems();
        if (list.length === 0) return;
        const current = list.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === "ArrowDown" ? (current + 1) % list.length : (current - 1 + list.length) % list.length;
        list[next]?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const firstDanger = items.findIndex((item) => item.danger);

  return (
    <div ref={root} className="relative shrink-0">
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={toggle}
        className="press flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-elevated hover:text-ink">
        {trigger ?? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="3.5" r="1.6" /><circle cx="9" cy="9" r="1.6" /><circle cx="9" cy="14.5" r="1.6" /></svg>
        )}
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label}
          className={`absolute right-0 z-30 min-w-[12.5rem] overflow-hidden rounded-xl border border-border bg-elevated py-1 shadow-2xl shadow-black/50 ${up ? "bottom-full mb-1" : "top-full mt-1"}`}>
          {items.map((item, i) => (
            <div key={item.key}>
              {i === firstDanger && i > 0 && <div role="separator" className="my-1 border-t border-border" />}
              <button type="button" role="menuitem" disabled={item.disabled} onClick={() => { setOpen(false); item.onSelect(); }}
                className={`flex min-h-[44px] w-full items-center px-3 text-left text-sm disabled:opacity-40 ${item.danger ? "text-danger hover:bg-danger/10" : "text-ink hover:bg-surface"}`}>
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
