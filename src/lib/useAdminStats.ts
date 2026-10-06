import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { getSocket } from "./socket";
import type { AdminStats } from "./types";

export type StatsRange = 7 | 14 | 30 | 90;
const POLL_MS = 30_000;

// Estatísticas do painel "em tempo real": o backend avisa por Socket.IO (dashboard.activity / admin.alert) sempre que
// há actividade (venda, pagamento, mensagem) e o painel volta a pedir os números (com 0,8 s de espera para juntar
// avisos seguidos). Se o Socket.IO falhar, uma consulta a cada 30 s garante que os números nunca ficam parados.
export function useAdminStats(token: string | null, days: StatsRange) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);
  const [live, setLive] = useState(false);
  const debounce = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setStats(await api.admin.stats(token, days));
      setError(false);
    } catch {
      setError(true);
    }
  }, [token, days]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    const refresh = () => {
      window.clearTimeout(debounce.current);
      debounce.current = window.setTimeout(() => void load(), 800);
    };
    const up = () => setLive(true);
    const down = () => setLive(false);
    setLive(socket.connected);
    socket.on("connect", up);
    socket.on("disconnect", down);
    socket.on("dashboard.activity", refresh);
    socket.on("admin.alert", refresh);
    return () => {
      window.clearTimeout(debounce.current);
      socket.off("connect", up);
      socket.off("disconnect", down);
      socket.off("dashboard.activity", refresh);
      socket.off("admin.alert", refresh);
    };
  }, [token, load]);

  return { stats, error, live, reload: load, loading: stats === null || stats.days !== days };
}
