import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useNotifications } from "@/notifications/NotificationsContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { BellIcon, CheckIcon } from "@/components/icons";

export default function NotificationsPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: `${t("notifications.title")} · Twisisa Market`, noindex: true });
  const navigate = useNavigate();
  const { items, unread: unreadCount, markRead, markAll } = useNotifications();

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">{t("notifications.title")}</h1>
          {unreadCount > 1 && <Button size="sm" variant="secondary" onClick={markAll}>{t("notifications.markAll")}</Button>}
        </div>
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
                  className={`rounded-2xl border p-4 ${n.readAt ? "border-border bg-surface" : "border-primary/40 bg-primary-soft"} ${orderId ? "press cursor-pointer hover:border-ink-faint" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-sm text-ink-muted">{n.message}</p>
                    </div>
                    {!n.readAt && (
                      <Button size="icon" variant="ghost" className="-mr-2 -mt-2 shrink-0" aria-label={t("notifications.markRead")} title={t("notifications.markRead")} onClick={(e) => { e.stopPropagation(); return markRead(n.id); }}>
                        <CheckIcon width={18} height={18} />
                      </Button>
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
