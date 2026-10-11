import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { timeAgo } from "@/lib/timeAgo";
import { useNotifications } from "@/notifications/NotificationsContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BellIcon, TrashIcon } from "@/components/icons";
import type { AppNotification } from "@/lib/types";

function dayLabel(date: string, locale: string, t: (k: string) => string): string {
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t("notif.today");
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t("notif.yesterday");
  return d.toLocaleDateString(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long" });
}

// Só segurança fica a vermelho. O resto é neutro: o vermelho a toda a hora cansava e deixava de significar "atenção".
const iconTone = (type: AppNotification["type"]) => (type === "SECURITY" ? "bg-danger/10 text-danger" : "bg-elevated text-ink-muted");
const clamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;

export default function NotificationsPage() {
  const { t, locale } = useLocale();
  useDocumentMeta({ title: `${t("notifications.title")} · Twisisa Market`, noindex: true });
  const { items, unread, markAll, removeAll } = useNotifications();
  const [confirmAll, setConfirmAll] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    (items ?? []).forEach((n) => {
      const key = dayLabel(n.createdAt, locale, t);
      map.set(key, [...(map.get(key) ?? []), n]);
    });
    return [...map.entries()];
  }, [items, locale, t]);

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{t("notifications.title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">{unread > 0 ? `${unread} ${t("notif.unread")}` : t("notif.allRead")}</p>
          </div>
          {items && items.length > 0 && (
            <div className="flex items-center gap-1">
              {unread > 0 && <button type="button" onClick={markAll} className="press rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-elevated">{t("notifications.markAll")}</button>}
              <button type="button" onClick={() => setConfirmAll(true)} aria-label={t("notif.deleteAll")} className="press flex h-10 w-10 items-center justify-center rounded-lg text-ink-faint hover:bg-elevated hover:text-ink"><TrashIcon width={18} height={18} /></button>
            </div>
          )}
        </div>

        {items === null && <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
        {items !== null && items.length === 0 && <EmptyState icon={<BellIcon width={28} height={28} />} title={t("notifications.empty")} description={t("notif.emptyHint")} />}

        {items !== null && groups.length > 0 && (
          <div className="space-y-6">
            {groups.map(([label, list]) => (
              <section key={label}>
                <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</h2>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {list.map((n) => {
                    const isUnread = !n.readAt;
                    return (
                      <li key={n.id}>
                        {/* Link: abre no mesmo toque, sem esperar por nenhum pedido ao servidor. */}
                        <Link to={`/notificacoes/${n.id}`} className="flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-elevated">
                          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconTone(n.type)}`}><BellIcon width={16} height={16} /></span>
                          <span className="min-w-0 flex-1">
                            {/* A mensagem é o texto principal; o título e a hora são apoio. */}
                            <span style={clamp2} className={`text-[15px] leading-snug ${isUnread ? "font-semibold text-ink" : "text-ink-muted"}`}>{n.message}</span>
                            <span className="mt-1 block truncate text-xs text-ink-faint">{n.title} · {timeAgo(n.createdAt, locale, t)}</span>
                          </span>
                          {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" role="img" aria-label={t("notif.unreadOne")} />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {confirmAll && (
        <Modal title={t("notif.deleteAll")} onClose={() => setConfirmAll(false)}>
          <p className="text-sm text-ink-muted">{t("notif.deleteAllBody")}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmAll(false)}>{t("common.cancel")}</Button>
            <Button className="flex-1" onClick={async () => { await removeAll(); setConfirmAll(false); }}>{t("notif.deleteAll")}</Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
