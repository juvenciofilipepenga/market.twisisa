import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, XIcon } from "../icons";
import { ZoomInIcon, ZoomOutIcon } from "./ChatIcons";

export interface ViewerItem {
  id: string;
  url: string;
  kind: "image" | "pdf";
  name: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const iconButton = "press flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/10 disabled:opacity-30";

// Visualizador por cima do chat: imagens e PDFs abrem aqui dentro. Nunca navega para o Cloudinary nem abre outro separador.
export function MediaViewer({ items, index, onClose, onIndex, labels }: {
  items: ViewerItem[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
  labels: { close: string; download: string; zoomIn: string; zoomOut: string; previous: string; next: string; downloadFailed: string };
}) {
  const item = items[index];
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [downloadError, setDownloadError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = items.length;

  useEffect(() => { setZoom(MIN_ZOOM); setDownloadError(false); }, [item?.id]);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      else if (event.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      else if (event.key === "ArrowRight" && index < count - 1) onIndex(index + 1);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, count, onClose, onIndex]);

  if (!item) return null;

  // Transfere sem sair do chat: vai buscar o ficheiro e grava-o a partir de um blob local.
  async function download(target: ViewerItem) {
    setDownloadError(false);
    try {
      const response = await fetch(target.url);
      if (!response.ok) throw new Error("download");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = target.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 10_000);
    } catch {
      setDownloadError(true);
    }
  }

  const isImage = item.kind === "image";
  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-[max(.5rem,env(safe-area-inset-top))]">
        <p className="min-w-0 flex-1 truncate text-sm text-white/80">{item.name}{count > 1 ? `  ·  ${index + 1}/${count}` : ""}</p>
        <div className="flex shrink-0 items-center gap-1">
          {isImage && <button type="button" className={iconButton} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.75))} disabled={zoom <= MIN_ZOOM} aria-label={labels.zoomOut} title={labels.zoomOut}><ZoomOutIcon width={20} height={20} /></button>}
          {isImage && <button type="button" className={iconButton} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.75))} disabled={zoom >= MAX_ZOOM} aria-label={labels.zoomIn} title={labels.zoomIn}><ZoomInIcon width={20} height={20} /></button>}
          <button type="button" className={iconButton} onClick={() => void download(item)} aria-label={labels.download} title={labels.download}><DownloadIcon width={20} height={20} /></button>
          <button ref={closeRef} type="button" className={iconButton} onClick={onClose} aria-label={labels.close} title={labels.close}><XIcon width={20} height={20} /></button>
        </div>
      </div>
      {downloadError && <p role="alert" className="shrink-0 px-4 pb-1 text-center text-xs text-red-300">{labels.downloadFailed}</p>}

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        {isImage ? (
          <div className={`h-full w-full overflow-auto ${zoom > MIN_ZOOM ? "" : "flex items-center justify-center"}`} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <img
              src={item.url}
              alt={item.name}
              draggable={false}
              onDoubleClick={() => setZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : 2.5))}
              style={zoom > MIN_ZOOM ? { width: `${zoom * 100}%`, maxWidth: "none", height: "auto" } : undefined}
              className={zoom > MIN_ZOOM ? "block select-none" : "max-h-full max-w-full select-none object-contain"}
            />
          </div>
        ) : (
          <iframe src={item.url} title={item.name} className="h-full w-full max-w-3xl bg-white" />
        )}
        {index > 0 && <button type="button" className={`${iconButton} absolute left-2 top-1/2 -translate-y-1/2 bg-black/40`} onClick={() => onIndex(index - 1)} aria-label={labels.previous} title={labels.previous}><ChevronLeftIcon width={22} height={22} /></button>}
        {index < count - 1 && <button type="button" className={`${iconButton} absolute right-2 top-1/2 -translate-y-1/2 bg-black/40`} onClick={() => onIndex(index + 1)} aria-label={labels.next} title={labels.next}><ChevronRightIcon width={22} height={22} /></button>}
      </div>
      <div className="shrink-0 pb-[max(.5rem,env(safe-area-inset-bottom))]" />
    </div>,
    document.body
  );
}
