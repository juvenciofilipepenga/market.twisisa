import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { useToast } from "@/components/ui/Toast";
import { playChime, vibrate } from "@/lib/notifyFeedback";
import type { AppNotification } from "@/lib/types";

// Sistema único de notificações: a lista, o número por ler (Header) e os avisos de novas
// notificações vêm todos daqui. Usa só o endpoint que já existe (GET /notifications) e os
// avisos passam pelo ToastProvider do projecto — não há um segundo sistema de avisos.
const POLL_MS = 30_000;

interface NotificationsValue {
  /** null enquanto carrega pela primeira vez. */
  items: AppNotification[] | null;
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  // Ids já vistos. null = ainda não houve a primeira carga (essa não gera aviso nem som).
  const seen = useRef<Set<string> | null>(null);
  const inFlight = useRef(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const latest = useRef({ t, toast, navigate });
  latest.current = { t, toast, navigate };

  // O admin não mostra notificações de cliente: não há pedidos enquanto lá estiver.
  const active = Boolean(token) && !pathname.startsWith("/admin");

  function announce(list: AppNotification[]) {
    if (seen.current === null) { seen.current = new Set(list.map((n) => n.id)); return; }
    const known = seen.current;
    const fresh = list.filter((n) => !n.readAt && !known.has(n.id));
    list.forEach((n) => known.add(n.id));
    if (fresh.length === 0) return;

    const { t: tr, toast: tt, navigate: go } = latest.current;
    playChime();
    vibrate();
    const view = { label: tr("notifications.view"), onClick: () => go("/notificacoes") };
    const only = fresh.length === 1 ? fresh[0] : undefined;
    if (only) {
      tt.show(only.title, { tone: "info", key: `notification-${only.id}`, action: view });
    } else {
      tt.show(`${fresh.length} ${tr("notifications.newMany")}`, { tone: "info", key: "notifications-new", action: view });
    }
  }

  const refresh = useCallback(async () => {
    const current = token;
    if (!current || inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await api.notifications.list(current);
      if (tokenRef.current !== current) return; // a sessão mudou durante o pedido
      setItems(res.data);
      announce(res.data);
    } catch {
      setItems((prev) => prev ?? []); // silencioso: as notificações não são críticas
    } finally {
      inFlight.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Nova sessão (ou fim dela): recomeça do zero.
  useEffect(() => {
    seen.current = null;
    if (authLoading) return;
    setItems(token ? null : []);
  }, [token, authLoading]);

  // Vai buscar à abertura, de 30 em 30 s enquanto o separador está visível, e ao voltar ao separador.
  useEffect(() => {
    if (!active || authLoading) return;
    refresh();
    const tick = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, [active, authLoading, refresh]);

  const markRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const updated = await api.notifications.markRead(id, token);
      setItems((prev) => prev?.map((n) => (n.id === id ? updated : n)) ?? null);
    } catch { /* falhou: fica por ler, o cliente pode tentar de novo */ }
  }, [token]);

  const remove = useCallback(async (id: string) => {
    if (!token) return;
    await api.notifications.remove(id, token);
    setItems((prev) => prev?.filter((n) => n.id !== id) ?? null);
  }, [token]);

  const removeAll = useCallback(async () => {
    if (!token) return;
    await api.notifications.removeAll(token);
    setItems([]);
  }, [token]);

  const markAll = useCallback(async () => {
    const pending = (items ?? []).filter((n) => !n.readAt);
    await Promise.all(pending.map((n) => markRead(n.id)));
  }, [items, markRead]);

  const unread = useMemo(() => (items ?? []).filter((n) => !n.readAt).length, [items]);

  const value = useMemo<NotificationsValue>(() => ({ items, unread, markRead, markAll, remove, removeAll }), [items, unread, markRead, markAll, remove, removeAll]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
