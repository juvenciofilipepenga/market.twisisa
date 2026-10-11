import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { notificationAction } from "@/lib/notificationAction";
import { orderStatusLabel } from "@/lib/orderStatus";
import { timeAgo } from "@/lib/timeAgo";
import type { OrderStatus } from "@/lib/types";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useNotifications } from "@/notifications/NotificationsContext";
import { buttonClass } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { BellIcon, ChevronLeftIcon, TrashIcon } from "@/components/icons";

// Detalhe de uma notificação: a MENSAGEM é o protagonista (grande, legível), o título é só o rótulo,
// há uma única ação útil, e nada de códigos técnicos. Abre logo, a partir da lista já em memória.
export default function NotificationPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const { items, markRead, remove } = useNotifications();
  const n = items?.find((item) => item.id === id) ?? null;
  useDocumentMeta({ title: `${n?.title ?? t("notif.detail")} · Twisisa Market`, noindex: true });

  // Marca como lida em segundo plano, uma só vez (se o servidor falhar não fica a repetir).
  const tried = useRef(false);
  useEffect(() => {
    if (n && !n.readAt && !tried.current) { tried.current = true; void markRead(n.id); }
  }, [n, markRead]);

  // Notificação que já não existe (apagada noutro sítio, ligação antiga): volta à lista.
  useEffect(() => {
    if (items !== null && !n) navigate("/notificacoes", { replace: true });
  }, [items, n, navigate]);

  async function onDelete() {
    if (!n) return;
    try {
      await remove(n.id);
      navigate("/notificacoes", { replace: true });
    } catch {
      toast.show(t("common.error"), { tone: "error", key: "notif-delete" });
    }
  }

  const action = n ? notificationAction(n, isAdmin) : null;
  const status = typeof n?.data?.status === "string" ? orderStatusLabel[locale][n.data.status as OrderStatus] ?? null : null;

  return (
    <main className="min-h-screen bg-bg pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-3">
          <button type="button" onClick={() => navigate("/notificacoes")} aria-label={t("pay.back")} className="press flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-elevated hover:text-ink"><ChevronLeftIcon width={20} height={20} /></button>
          <p className="text-sm font-semibold">{t("notif.detail")}</p>
          <button type="button" onClick={onDelete} disabled={!n} aria-label={t("notif.delete")} className="press flex h-10 w-10 items-center justify-center rounded-full text-ink-faint hover:bg-elevated hover:text-danger disabled:opacity-30"><TrashIcon width={18} height={18} /></button>
        </div>
      </header>

      {!n && <div className="mx-auto max-w-xl space-y-3 px-5 pt-8"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-24 w-full" /></div>}

      {n && (
        <article className="mx-auto max-w-xl px-5 pt-7">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${n.type === "SECURITY" ? "bg-danger/10 text-danger" : "bg-elevated text-ink-muted"}`}><BellIcon width={13} height={13} /></span>
            {n.title}
          </p>
          <p className="mt-4 text-[22px] font-semibold leading-snug text-ink">{n.message}</p>
          <p className="mt-4 text-sm text-ink-muted">{timeAgo(n.createdAt, locale, t)} · {new Date(n.createdAt).toLocaleString(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>

          {status && (
            <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              <span className="text-ink-muted">{t("notif.status")}: </span><span className="font-semibold">{status}</span>
            </p>
          )}

          {action && <Link to={action.to} className={buttonClass("primary", "lg", "mt-8 w-full")}>{t(action.labelKey)}</Link>}
        </article>
      )}
    </main>
  );
}
