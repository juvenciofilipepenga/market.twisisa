import type { ReactNode } from "react";
import { XIcon } from "../icons";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-elevated hover:text-ink" aria-label="Fechar">
            <XIcon width={20} height={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
