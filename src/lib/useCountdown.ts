import { useEffect, useMemo, useState } from "react";

/**
 * Milissegundos que faltam até `deadline` (ISO), ou null se não há prazo.
 * `serverNow` corrige a diferença entre o relógio do telemóvel e o do servidor: o prazo é do servidor.
 * Faz um único tick por segundo e para quando chega a zero.
 */
export function useCountdown(deadline: string | null | undefined, serverNow?: string | null): number | null {
  // A diferença de relógios mede-se uma só vez, quando a resposta do servidor chega.
  const offset = useMemo(() => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0), [serverNow]);
  const target = deadline ? new Date(deadline).getTime() : null;
  const [remaining, setRemaining] = useState<number | null>(() => (target === null ? null : Math.max(0, target - (Date.now() + offset))));

  useEffect(() => {
    if (target === null) { setRemaining(null); return; }
    const left = () => Math.max(0, target - (Date.now() + offset));
    setRemaining(left());
    const timer = window.setInterval(() => {
      const value = left();
      setRemaining(value);
      if (value <= 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target, offset]);

  return remaining;
}
