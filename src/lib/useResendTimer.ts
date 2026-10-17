import { useCallback, useState } from "react";
import { useCountdown } from "./useCountdown";

const KEY = "twisisa.recover";

interface Stored { email: string; until: string; total: number; minutes: number | null }

function read(): Stored | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Stored;
    return new Date(data.until).getTime() > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function write(value: Stored | null) {
  try {
    if (value) window.sessionStorage.setItem(KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(KEY);
  } catch { /* sem armazenamento: o timer só não sobrevive a um refresh */ }
}

export function useResendTimer() {
  const [stored, setStored] = useState<Stored | null>(read);
  const remaining = useCountdown(stored?.until);
  const seconds = remaining === null ? 0 : Math.ceil(remaining / 1000);

  const start = useCallback((email: string, secs: number, minutes: number | null) => {
    const next = { email, until: new Date(Date.now() + secs * 1000).toISOString(), total: secs, minutes };
    write(next);
    setStored(next);
  }, []);

  const clear = useCallback(() => {
    write(null);
    setStored(null);
  }, []);

  return {
    seconds,
    total: stored?.total ?? 0,
    email: seconds > 0 ? stored?.email ?? null : null,
    minutes: stored?.minutes ?? null,
    start,
    clear
  };
}
