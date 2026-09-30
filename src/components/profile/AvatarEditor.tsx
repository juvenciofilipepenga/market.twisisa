import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { avatarSrc, removeAvatar, saveAvatar } from "@/lib/avatar";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { AvatarCropper } from "./AvatarCropper";
import { CameraIcon, ImageIcon, TrashIcon } from "../icons";

const MAX_BYTES = 15 * 1024 * 1024;
const MENU_W = 192;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "")).toUpperCase() || "?";
}

interface Props { name: string; photo: string | null; token: string; onChange: (photo: string | null) => void }

// Avatar com botão de câmara e um menu pequeno: Câmara | Galeria (| Remover, se já houver foto).
// Câmara abre a câmara frontal no telemóvel (no computador abre o seletor de ficheiros).
export function AvatarEditor({ name, photo, token, onChange }: Props) {
  const { t } = useLocale();
  const toast = useToast();
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [broken, setBroken] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setBroken(false); }, [photo]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || button.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { close(); button.current?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    menuRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  function toggleMenu() {
    if (menu) { setMenu(null); return; }
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    setMenu({ top: r.bottom + 8, left: Math.min(Math.max(12, r.right - MENU_W), window.innerWidth - MENU_W - 12) });
  }

  function onPick(e: { target: { files: FileList | null; value: string } }) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // permite escolher a mesma foto outra vez
    if (!picked) return;
    if (!picked.type.startsWith("image/")) { toast.show(t("avatar.invalid"), { tone: "error", key: "avatar" }); return; }
    if (picked.size > MAX_BYTES) { toast.show(t("avatar.tooBig"), { tone: "error", key: "avatar" }); return; }
    setFile(picked);
  }

  async function onSaved(blob: Blob) {
    try {
      const saved = await saveAvatar(blob, token);
      onChange(saved.url);
      setFile(null);
      toast.show(saved.where === "cloud" ? t("avatar.updated") : t("avatar.savedLocal"), { key: "avatar" });
    } catch {
      toast.show(t("avatar.error"), { tone: "error", key: "avatar" });
    }
  }

  async function onRemove() {
    setMenu(null);
    try {
      await removeAvatar(token);
      onChange(null);
      toast.show(t("avatar.removed"), { key: "avatar" });
    } catch {
      toast.show(t("avatar.error"), { tone: "error", key: "avatar" });
    }
  }

  const src = photo && !broken ? avatarSrc(photo, 80) : null;
  const item = "press flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-ink hover:bg-surface";

  return (
    <div className="relative -mt-10 h-20 w-20">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary-active font-display text-3xl font-extrabold text-white">
        {src ? <img src={src} alt="" width={80} height={80} onError={() => setBroken(true)} className="h-full w-full object-cover" /> : <span aria-hidden="true">{initials(name)}</span>}
      </div>
      <button
        ref={button}
        type="button"
        onClick={toggleMenu}
        aria-label={t("avatar.change")}
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        className="press absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-md hover:bg-primary-hover"
      >
        <CameraIcon width={17} height={17} />
      </button>

      <input ref={cameraInput} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick} />
      <input ref={galleryInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onPick} />

      {menu && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="menu-in fixed z-[75] rounded-2xl border border-border bg-elevated p-1.5 shadow-2xl shadow-black/60"
          style={{ top: menu.top, left: menu.left, width: MENU_W }}
        >
          <button role="menuitem" className={item} onClick={() => { setMenu(null); cameraInput.current?.click(); }}><CameraIcon width={18} height={18} className="text-primary-text" />{t("avatar.camera")}</button>
          <button role="menuitem" className={item} onClick={() => { setMenu(null); galleryInput.current?.click(); }}><ImageIcon width={18} height={18} className="text-primary-text" />{t("avatar.gallery")}</button>
          {photo && (
            <>
              <div className="mx-2 my-1 h-px bg-border" />
              <button role="menuitem" className={`${item} text-danger`} onClick={onRemove}><TrashIcon width={18} height={18} />{t("avatar.remove")}</button>
            </>
          )}
        </div>,
        document.body
      )}

      {file && (
        <Modal size="sm" title={t("avatar.adjust")} onClose={() => setFile(null)}>
          <AvatarCropper file={file} onCancel={() => setFile(null)} onSave={onSaved} />
        </Modal>
      )}
    </div>
  );
}
