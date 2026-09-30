import { useCallback, useEffect, useRef, useState } from "react";

// Copia para a área de transferência. O fallback com textarea cobre páginas sem HTTPS/permissão
// e navegadores móveis mais antigos, onde navigator.clipboard falha.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* cai para o fallback */ }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

// `copiedKey` diz qual botão acabou de copiar (vários botões podem partilhar o mesmo hook).
export function useCopy(resetMs = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string, key = "default") => {
    const ok = await copyText(text);
    setFailed(!ok);
    setCopiedKey(ok ? key : null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setCopiedKey(null); setFailed(false); }, resetMs);
    return ok;
  }, [resetMs]);

  return { copiedKey, failed, copy };
}
