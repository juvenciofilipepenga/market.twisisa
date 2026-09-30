import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { XIcon } from "../icons";

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Zona de destaque no topo (imagem, ilustração). Sem título, o botão de fechar fica por cima dela. */
  art?: ReactNode;
}

const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input:not([type="hidden"]),select,[tabindex]:not([tabindex="-1"])';
const EXIT_MS = 180;

// Telemóvel: painel que sobe da base, com pega e arrasto para baixo para fechar.
// Ecrã largo: diálogo centrado. Em ambos: Esc e clique fora fecham, o foco fica preso lá dentro
// e volta ao elemento anterior, o scroll da página fica bloqueado.
export function Modal({ title, onClose, children, size = "md", art }: ModalProps) {
  const { t } = useLocale();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, EXIT_MS);
  }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { requestClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const state = closing ? "closed" : "open";
  const closeButton = (
    <button onClick={requestClose} aria-label={t("common.close")} className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:text-ink ${title ? "hover:bg-elevated" : "absolute right-3 top-3 z-10 bg-bg/60 backdrop-blur"}`}>
      <XIcon width={18} height={18} />
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div data-state={state} className="modal-backdrop absolute inset-0 bg-black/65" onClick={requestClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        data-state={state}
        style={{ transform: drag ? `translateY(${drag}px)` : undefined, transition: drag || startY.current !== null ? "none" : "transform 0.2s ease" }}
        className={`modal-panel relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl shadow-black/60 outline-none supports-[height:1dvh]:max-h-[92dvh] sm:rounded-3xl ${widths[size]}`}
      >
        <div
          className="flex shrink-0 touch-none justify-center pb-1 pt-2.5 sm:hidden"
          onTouchStart={(e) => { startY.current = e.touches[0]?.clientY ?? null; }}
          onTouchMove={(e) => { if (startY.current !== null) setDrag(Math.max(0, (e.touches[0]?.clientY ?? 0) - startY.current)); }}
          onTouchEnd={() => { const dy = drag; startY.current = null; if (dy > 90) requestClose(); else setDrag(0); }}
        >
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>
        {art && <div className="relative shrink-0">{art}{!title && closeButton}</div>}
        {title ? (
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-2 sm:pt-5">
            <h2 id={titleId} className="text-lg font-bold">{title}</h2>
            {closeButton}
          </div>
        ) : !art ? closeButton : null}
        <div className="safe-bottom overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
