import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { adminError } from "@/lib/errors";
import { formatMzn } from "@/lib/format";
import { shortOrder } from "@/lib/orderNumber";
import { timeAgo } from "@/lib/timeAgo";
import type { AdminAttention, AttentionOrder, AttentionToPrepare } from "@/lib/types";
import { Button, buttonClass } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { PendingManualPayments } from "./PendingManualPayments";

const METHOD: Record<string, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola", CARD: "Cartão" };

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
        {title}
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white tabular-nums">{count}</span>
      </h2>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

function OrderRow({ order, extra, action, t, locale }: { order: AttentionOrder; extra?: ReactNode; action: ReactNode; t: (k: string) => string; locale: string }) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" title={order.orderNumber}>{shortOrder(order.orderNumber)} <span className="font-normal text-ink-muted">· {order.customer}</span></p>
          <p className="text-xs text-ink-faint">{timeAgo(order.since, locale, t)}</p>
          {extra}
        </div>
        <p className="shrink-0 font-display text-lg font-extrabold tabular-nums">{formatMzn(order.totalMzn)}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{action}</div>
    </li>
  );
}

// "Precisa da sua atenção": SEMPRE o primeiro bloco do painel. Cada linha diz quem, quanto, quando e tem uma só ação.
// Aqui não há listas de encomendas para filtrar: só trabalho por fazer, o mais antigo primeiro.
export function AttentionBoard({ token, data, reload }: { token: string; data: AdminAttention | null; reload: () => void }) {
  const { t, locale } = useLocale();
  const toast = useToast();

  async function prepare(order: AttentionToPrepare) {
    try {
      await api.admin.orders.updateStatus(token, order.id, "PROCESSING");
      toast.show(t("admin.attn.prepared"), { key: `prep-${order.id}` });
      reload();
    } catch (err) {
      toast.show(adminError(err, t), { tone: "error", key: "prep-err" });
    }
  }

  if (!data) return <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>;

  const { counts } = data;
  return (
    <div className="space-y-3">
      {counts.total === 0 && (
        <section className="rounded-2xl border border-success/40 bg-success/10 px-4 py-5 text-center">
          <p className="font-display text-lg font-extrabold text-success">{t("admin.attn.allClear")}</p>
          <p className="mt-1 text-sm text-ink-muted">{t("admin.attn.allClearHint")}</p>
        </section>
      )}

      {/* 1) Alguém pagou: nome, número, valor e hora, em letra grande; aprovar na própria linha. */}
      <PendingManualPayments token={token} hideWhenEmpty onChanged={reload} />

      {data.toPrepare.length > 0 && (
        <Group title={t("admin.attn.toPrepare")} count={counts.toPrepare}>
          {data.toPrepare.map((o) => (
            <OrderRow key={o.id} order={o} t={t} locale={locale}
              extra={
                <>
                  <p className="mt-1 truncate text-sm text-ink-muted">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}{o.itemCount > o.items.reduce((n, i) => n + i.quantity, 0) ? " …" : ""}</p>
                  {(o.payerName || o.payerNumber) && (
                    <p className="mt-1 text-sm font-semibold">
                      {t("admin.attn.paidBy")} {o.payerName ?? o.customer}{o.payerNumber ? ` · ${o.payerNumber}` : ""}{o.method ? <span className="font-normal text-ink-muted"> · {METHOD[o.method] ?? o.method}</span> : null}
                    </p>
                  )}
                </>
              }
              action={<><Button size="sm" onClick={() => prepare(o)}>{t("admin.attn.startPrepare")}</Button><Link to={`/admin/pedidos?q=${encodeURIComponent(o.orderNumber)}`} className={buttonClass("secondary", "sm")}>{t("admin.attn.view")}</Link></>} />
          ))}
        </Group>
      )}

      {data.cancelRequests.length > 0 && (
        <Group title={t("admin.attn.cancel")} count={counts.cancelRequests}>
          {data.cancelRequests.map((o) => <OrderRow key={o.id} order={o} t={t} locale={locale} action={<Link to={`/admin/pedidos?q=${encodeURIComponent(o.orderNumber)}`} className={buttonClass("secondary", "sm")}>{t("admin.attn.open")}</Link>} />)}
        </Group>
      )}

      {data.refunds.length > 0 && (
        <Group title={t("admin.attn.refund")} count={counts.refunds}>
          {data.refunds.map((o) => <OrderRow key={o.id} order={o} t={t} locale={locale} action={<Link to={`/admin/pedidos?q=${encodeURIComponent(o.orderNumber)}`} className={buttonClass("secondary", "sm")}>{t("admin.attn.open")}</Link>} />)}
        </Group>
      )}

      {data.chats.length > 0 && (
        <Group title={t("admin.attn.chats")} count={counts.chats}>
          {data.chats.map((c) => (
            <li key={c.id} className="py-3">
              <p className="text-sm font-semibold">{c.customer} <span className="text-xs font-normal text-ink-faint">· {timeAgo(c.since, locale, t)}</span></p>
              {c.preview && <p className="mt-0.5 text-sm text-ink-muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.preview}</p>}
              <Link to="/admin/chat" className={buttonClass("secondary", "sm", "mt-2")}>{t("admin.attn.reply")}</Link>
            </li>
          ))}
        </Group>
      )}

      {data.lowStock.length > 0 && (
        <Group title={t("admin.attn.stock")} count={counts.lowStock}>
          {data.lowStock.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${p.stock === 0 ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"}`}>{p.stock === 0 ? t("admin.attn.soldOut") : `${p.stock} ${t("admin.attn.left")}`}</span>
            </li>
          ))}
          <li className="pt-3"><Link to="/admin/produtos" className={buttonClass("secondary", "sm")}>{t("admin.attn.openProducts")}</Link></li>
        </Group>
      )}
    </div>
  );
}
