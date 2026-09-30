import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { Button } from "../ui/Button";
import { MinusIcon, PlusIcon } from "../icons";

const V = 256;   // diâmetro do círculo de recorte (px no ecrã)
const OUT = 512; // lado da imagem final
const MAX_ZOOM = 3;

interface Props { file: File; onCancel: () => void; onSave: (blob: Blob) => Promise<void> }

// Recorte circular: arrastar para posicionar, controlo para aproximar. A imagem final é 512×512 WebP
// (poucos KB), em vez da foto original de vários MB do telemóvel.
export function AvatarCropper({ file, onCancel, onSave }: Props) {
  const { t } = useLocale();
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const base = nat ? V / Math.min(nat.w, nat.h) : 1;
  const scale = base * zoom;

  function clamp(x: number, y: number, z: number) {
    if (!nat) return { x: 0, y: 0 };
    const sc = base * z;
    const mx = Math.max(0, (nat.w * sc - V) / 2);
    const my = Math.max(0, (nat.h * sc - V) / 2);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  }

  function changeZoom(z: number) {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOff((o) => clamp(o.x, o.y, next));
  }

  function onKeyDown(e: { key: string; preventDefault: () => void }) {
    const step = 12;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = moves[e.key];
    if (m) { e.preventDefault(); setOff((o) => clamp(o.x + m[0], o.y + m[1], zoom)); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); changeZoom(zoom + 0.2); }
    else if (e.key === "-") { e.preventDefault(); changeZoom(zoom - 0.2); }
  }

  async function save() {
    const im = imgRef.current;
    if (!im || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const side = V / scale;
    const cx = nat.w / 2 - off.x / scale;
    const cy = nat.h / 2 - off.y / scale;
    ctx.fillStyle = "#1D1716";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(im, cx - side / 2, cy - side / 2, side, side, 0, 0, OUT, OUT);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!blob) throw new Error("encode failed");
    await onSave(blob);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        tabIndex={0}
        role="img"
        aria-label={t("avatar.dragHint")}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }; }}
        onPointerMove={(e) => { const d = drag.current; if (d) setOff(clamp(d.ox + e.clientX - d.x, d.oy + e.clientY - d.y, zoom)); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        className="relative cursor-grab touch-none select-none overflow-hidden rounded-full bg-elevated active:cursor-grabbing"
        style={{ width: V, height: V }}
      >
        {src && (
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={nat ? { width: nat.w * scale, height: nat.h * scale, transform: `translate(-50%, -50%) translate(${off.x}px, ${off.y}px)` } : { opacity: 0 }}
          />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-white/60" />
      </div>

      <p className="mt-3 text-center text-xs text-ink-faint">{t("avatar.dragHint")}</p>

      <div className="mt-4 flex w-full max-w-[256px] items-center gap-3">
        <button type="button" onClick={() => changeZoom(zoom - 0.2)} aria-label="-" className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink"><MinusIcon width={16} height={16} /></button>
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} aria-label={t("avatar.zoom")} className="h-2 w-full cursor-pointer accent-primary" />
        <button type="button" onClick={() => changeZoom(zoom + 0.2)} aria-label="+" className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:text-ink"><PlusIcon width={16} height={16} /></button>
      </div>

      <div className="mt-6 flex w-full gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>{t("common.cancel")}</Button>
        <Button size="lg" className="flex-1" disabled={!nat} onClick={save}>{t("common.save")}</Button>
      </div>
    </div>
  );
}
