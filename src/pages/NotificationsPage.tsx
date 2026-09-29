import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import type { AppNotification } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { BellIcon, CheckIcon } from "@/components/icons";

export default function NotificationsPage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    if (!token) { setItems([]); return; }
    api.notifications.list(token).then((res) => setItems(res.data)).catch(() => setItems([]));
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    const updated = await api.notifications.markRead(id, token);
    setItems((prev) => prev?.map((n) => (n.id === id ? updated : n)) ?? null);
  }

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t("notifications.title")}</h1>
        {items === null && <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
        {items !== null && items.length === 0 && <EmptyState title={t("notifications.empty")} icon={<BellIcon width={26} height={26} />} />}
        {items !== null && items.length > 0 && (
          <div className="space-y-2">
            {items.map((n) => {
              // Não existe endpoint para listar encomendas passadas do cliente (ver README) —
              // por isso, quando a notificação refere uma encomenda, este link é uma das
              // poucas formas de lá voltar.
              const orderId = typeof n.data?.orderId === "string" ? n.data.orderId : null;
              return (
                <div
                  key={n.id}
                  onClick={() => { if (orderId) navigate(`/encomenda/${orderId}`); if (!n.readAt) markRead(n.id); }}
                  className={`rounded-xl border p-3 ${n.readAt ? "border-border bg-surface" : "border-primary/40 bg-primary/5"} ${orderId ? "cursor-pointer hover:border-primary/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-sm text-ink-muted">{n.message}</p>
                    </div>
                    {!n.readAt && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-success" title={t("notifications.markRead")}>
                        <CheckIcon width={16} height={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
