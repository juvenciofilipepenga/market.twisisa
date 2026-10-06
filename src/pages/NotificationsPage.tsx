import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useNotifications } from "@/notifications/NotificationsContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { BellIcon, TrashIcon, ChevronRightIcon } from "@/components/icons";
import type { AppNotification } from "@/lib/types";

function groupLabel(date: string, locale: string) { const d = new Date(date); const now = new Date(); if (d.toDateString() === now.toDateString()) return locale === "pt" ? "Hoje" : "Today"; const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); if (d.toDateString() === yesterday.toDateString()) return locale === "pt" ? "Ontem" : "Yesterday"; return d.toLocaleDateString(locale === "pt" ? "pt-PT" : "en-US", { day: "2-digit", month: "long" }); }
function iconTone(type: AppNotification["type"]) { return type === "PAYMENT" ? "bg-primary-soft text-primary" : type === "SECURITY" ? "bg-danger/10 text-danger" : type === "SUPPORT" ? "bg-elevated text-ink" : "bg-elevated text-ink-muted"; }

export default function NotificationsPage() {
  const { t, locale } = useLocale(); useDocumentMeta({ title: `${t("notifications.title")} · Twisisa Market`, noindex: true });
  const { items, unread, markRead, markAll, remove, removeAll } = useNotifications();
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const groups = useMemo(() => { const map = new Map<string, AppNotification[]>(); (items ?? []).forEach((n) => { const key = groupLabel(n.createdAt, locale); map.set(key, [...(map.get(key) ?? []), n]); }); return [...map.entries()]; }, [items, locale]);
  async function open(n: AppNotification) { if (!n.readAt) await markRead(n.id); setSelected(n); }
  async function deleteSelected() { if (!selected) return; const id = selected.id; setSelected(null); await remove(id); }

  return <main className="pb-10"><Header /><div className="mx-auto max-w-2xl px-4 py-4">
    <div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">{t("notifications.title")}</h1><p className="mt-1 text-sm text-ink-muted">{unread} {locale === "pt" ? "por ler" : "unread"}</p></div>{items && items.length > 0 && <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={markAll}>{t("notifications.markAll")}</Button><Button size="sm" variant="ghost" onClick={() => setConfirmAll(true)} aria-label={locale === "pt" ? "Eliminar todas" : "Delete all"}><TrashIcon width={16} height={16} /></Button></div>}</div>
    {items === null && <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}
    {items !== null && items.length === 0 && <EmptyState title={t("notifications.empty")} icon={<BellIcon width={26} height={26} />} />}
    {items !== null && groups.length > 0 && <div className="space-y-6">{groups.map(([label, list]) => <section key={label}><h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</h2><div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">{list.map((n) => <div key={n.id} className={`group flex items-center gap-3 px-3 py-3 transition hover:bg-elevated ${!n.readAt ? "bg-primary-soft/40" : ""}`}>
      <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone(n.type)}`}><BellIcon width={18} height={18} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`truncate text-sm ${n.readAt ? "font-medium" : "font-bold"}`}>{n.title}</span>{!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}</span><span className="mt-0.5 block truncate text-xs text-ink-muted">{n.message}</span><span className="mt-1 block text-[11px] text-ink-faint">{new Date(n.createdAt).toLocaleTimeString(locale === "pt" ? "pt-PT" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span></span><ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-faint" /></button>
      <button onClick={() => remove(n.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint opacity-60 hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100" aria-label={locale === "pt" ? "Eliminar" : "Delete"}><TrashIcon width={16} height={16} /></button>
    </div>)}</div></section>)}</div>}
  </div>
  {selected && <Modal title={selected.title} onClose={() => setSelected(null)}><div className="space-y-4"><p className="text-sm leading-relaxed text-ink-muted">{selected.message}</p><div className="rounded-xl border border-border bg-elevated p-3 text-xs text-ink-muted"><p>{new Date(selected.createdAt).toLocaleString(locale === "pt" ? "pt-PT" : "en-US")}</p>{typeof selected.data?.orderId === "string" && <p className="mt-1">ID da encomenda: {selected.data.orderId}</p>}{typeof selected.data?.status === "string" && <p className="mt-1">Estado: {selected.data.status}</p>}</div><div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>{t("common.close")}</Button><Button variant="ghost" onClick={deleteSelected}><TrashIcon width={16} height={16} /></Button></div></div></Modal>}
  {confirmAll && <Modal title={locale === "pt" ? "Eliminar notificações" : "Delete notifications"} onClose={() => setConfirmAll(false)}><p className="text-sm text-ink-muted">{locale === "pt" ? "Todas as notificações serão eliminadas." : "All notifications will be deleted."}</p><div className="mt-4 flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => setConfirmAll(false)}>{t("common.cancel")}</Button><Button className="flex-1" onClick={async () => { await removeAll(); setConfirmAll(false); }}>{locale === "pt" ? "Eliminar todas" : "Delete all"}</Button></div></Modal>}
  </main>;
}
