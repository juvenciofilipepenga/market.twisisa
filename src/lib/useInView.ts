import { useEffect, useRef, useState } from "react";

// Devolve [ref, inView]: fica true (e não volta a false) quando o elemento entra no ecrã.
// Sem IntersectionObserver (navegadores muito antigos) mostra tudo de imediato.
export function useInView<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px", ...options });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView] as const;
}
