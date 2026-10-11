import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { AdminAttention } from "./types";

// O que espera pelo admin, sempre atual: pergunta de 30 em 30 s e logo que o separador volta a ficar visível.
export function useAdminAttention(token: string | null) {
  const [data, setData] = useState<AdminAttention | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api.admin.attention(token));
      setError(false);
    } catch {
      setError(true);
    }
  }, [token]);

  useEffect(() => {
    void reload();
    const id = window.setInterval(reload, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") void reload(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [reload]);

  return { data, error, reload };
}
