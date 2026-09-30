import { useEffect, useState } from "react";
import { SHOW_HEADER_EVENT } from "./fx";

// Cabeçalho que se esconde ao descer e volta ao subir: no telemóvel devolve ~100 px ao conteúdo.
export function useHideOnScroll(disabled = false): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (y < 120) setHidden(false);
        else if (delta > 8) setHidden(true);
        else if (delta < -8) setHidden(false);
        if (Math.abs(delta) > 8 || y < 120) last = y;
        ticking = false;
      });
    };
    const show = () => setHidden(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(SHOW_HEADER_EVENT, show);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener(SHOW_HEADER_EVENT, show); };
  }, []);

  return hidden && !disabled;
}
