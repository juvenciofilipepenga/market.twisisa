import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { adminError, labelOr } from "@/lib/errors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMzn } from "@/lib/format";
import { shortOrder } from "@/lib/orderNumber";
import { timeAgo } from "@/lib/timeAgo";
import { useAdminAttention } from "@/lib/useAdminAttention";
import type { Order, OrderBucket, OrderStatus, Payment } from "@/lib/types";
import { bucketOf, ORDER_STATUSES, orderStatusLabel, nextStatusOptions } from "@/lib/orderStatus";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, buttonClass } from "@/components/ui/Button";
import { ClipboardIcon } from "@/components/icons";
import { OrderTrackingForm, TRACKABLE } from "@/components/admin/OrderTrackingForm";

const FIRST = 5;
const MORE = 10;
// Mudanças que se fazem à mão mas custam caro enganar: pedem confirmação.
const CONFIRM_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];
const METHOD: Record<string, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola", CARD: "Cartão" };
const TABS: Array<{ key: OrderBucket; label: string }> = [
  { key: "action", label: "admin.orders.tab.action" },
  { key: "ongoing", label: "admin.orders.tab.ongoing" },
  { key: "done", label: "admin.orders.tab.done" }
];

// Quem pagou, o número e a hora: em letra clara, não como pormenor no fim do cartão.
function PaymentBlock({ order, payment: p, t, locale }: { order: Order; payment: Payment; t: (k: string) => string; locale: string }) {
  const waiting = p.status === "PROOF_SUBMITTED" || p.status === "UNDER_REVIEW";
  const when = p.confirmedAt ?? p.paidClaimedAt ?? p.createdAt;
  const fmt = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="rounded-xl border border-border bg-elevated p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xl font-extrabold tabular-nums">{formatMzn(p.amountMzn)}</p>
        <p className="text-xs font-semibold">{labelOr(t, `admin.pay.${p.status}`, p.status)}</p>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.payset.payer")}</dt><dd className="min-w-0 truncate text-right font-semibold">{p.payerName ?? order.user?.name ?? "—"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.payset.number")}</dt><dd className="font-mono font-semibold">{p.paymentNumber ?? "—"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.orders.when")}</dt><dd className="font-semibold">{fmt.format(new Date(when))}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.orders.method")}</dt><dd>{METHOD[p.method ?? ""] ?? p.method ?? "—"}{p.provider === "MANUAL" ? ` · ${t("admin.orders.manual")}` : ""}</dd></div>
        {p.transactionCode && <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.orders.code")}</dt><dd className="font-mono text-xs font-semibold">{p.transactionCode}</dd></div>}
      </dl>
      {p.proofUrl && <a href={p.proofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary underline">{t("admin.orders.reviewProof")}</a>}
      {waiting && (
        <div className="mt-3 rounded-lg bg-warning/10 px-3 py-2.5">
          <p className="text-sm font-semibold text-warning">{t("admin.orders.waitingConfirm")}</p>
          <Link to="/admin/pagamentos" className={buttonClass("secondary", "sm", "mt-2")}>{t("admin.orders.goConfirm")}</Link>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const legacy = params.get("status") as OrderStatus | null;
  const bucket: OrderBucket = (["action", "ongoing", "done"].includes(params.get("bucket") ?? "") ? params.get("bucket") : legacy && ORDER_STATUSES.includes(legacy) ? bucketOf(legacy) : "action") as OrderBucket;
  const urlQuery = params.get("q") ?? "";

  const [search, setSearch] = useState(urlQuery);
  const [q, setQ] = useState(urlQuery);
  const [limit, setLimit] = useState(FIRST);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, OrderStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<Order | null>(null);
  const attention = useAdminAttention(token);

  // Pesquisa com pequena pausa (não pergunta ao servidor a cada letra).
  useEffect(() => { const id = window.setTimeout(() => setQ(search.trim()), 300); return () => window.clearTimeout(id); }, [search]);
  // Mudar de separador ou de pesquisa recomeça nas 5 mais recentes.
  useEffect(() => { setLimit(FIRST); setExpanded(null); }, [bucket, q]);

  function load() {
    if (!token) return;
    api.admin.orders.list(token, { bucket: q ? undefined : bucket, q: q || undefined, page: 1, limit })
      .then((r) => { setOrders(r.data); setTotal(r.pagination.total); setError(null); })
      .catch((err) => { setOrders((prev) => prev ?? []); setError(adminError(err, t)); })
      .finally(() => setLoadingMore(false));
  }
  useEffect(load, [token, bucket, q, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const setBucket = (next: OrderBucket) => { setOrders(null); setParams(next === "action" ? {} : { bucket: next }, { replace: true }); };

  async function applyStatus(order: Order) {
    if (!token) return;
    const next = pendingStatus[order.id];
    if (!next) return;
    setError(null);
    try {
      await api.admin.orders.updateStatus(token, order.id, next);
      setPendingStatus((prev) => { const { [order.id]: _done, ...rest } = prev; return rest; });
      load();
      void attention.reload();
    } catch (err) {
      setError(adminError(err, t));
    }
  }

  const actionCount = attention.data ? attention.data.counts.paymentsToConfirm + attention.data.counts.toPrepare + attention.data.counts.cancelRequests + attention.data.counts.refunds : 0;
  const canMore = orders !== null && orders.length < total && limit < 100;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-3 text-xl font-bold">{t("admin.nav.orders")}</h1>

      {/* 3 separadores em vez de 12 estados */}
      <div role="tablist" aria-label={t("admin.nav.orders")} className="mb-3 flex rounded-xl border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button key={tab.key} role="tab" aria-selected={!q && bucket === tab.key} onClick={() => { setSearch(""); setBucket(tab.key); }}
            className={`press flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold ${!q && bucket === tab.key ? "bg-primary text-white" : "text-ink-muted hover:text-ink"}`}>
            {t(tab.label)}
            {tab.key === "action" && actionCount > 0 && <span className={`rounded-full px-1.5 text-xs tabular-nums ${!q && bucket === "action" ? "bg-white/25" : "bg-primary text-white"}`}>{actionCount}</span>}
          </button>
        ))}
      </div>

      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.orders.search")} aria-label={t("admin.orders.search")}
        className="mb-4 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base placeholder:text-ink-faint focus:border-ink-faint focus:outline-none sm:text-sm" />
      {q && <p className="-mt-2 mb-3 text-xs text-ink-faint">{t("admin.orders.searchingAll")} «{q}»</p>}

      {error && <p role="alert" className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {orders === null && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}
      {orders !== null && orders.length === 0 && <EmptyState title={t(q ? "admin.orders.noResults" : `admin.orders.empty.${bucket}`)} icon={<ClipboardIcon width={24} height={24} />} />}

      {orders !== null && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => {
            const options = nextStatusOptions(order.status);
            const isOpen = expanded === order.id;
            const waiting = order.payments?.some((p) => p.status === "PROOF_SUBMITTED" || p.status === "UNDER_REVIEW");
            const units = (order.items ?? []).reduce((n, i) => n + i.quantity, 0);
            const since = (order as Order & { updatedAt?: string }).updatedAt ?? order.createdAt;
            const payments = [...(order.payments ?? [])].sort((a, b) => Number(["FAILED", "CANCELLED", "TIMEOUT", "PAYMENT_REJECTED"].includes(a.status)) - Number(["FAILED", "CANCELLED", "TIMEOUT", "PAYMENT_REJECTED"].includes(b.status)));
            return (
              <article key={order.id} className="rounded-2xl border border-border bg-surface p-3.5">
                <button onClick={() => setExpanded(isOpen ? null : order.id)} aria-expanded={isOpen} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" title={order.orderNumber}>{shortOrder(order.orderNumber)} <span className="font-normal text-ink-muted">· {order.user?.name ?? "—"}</span></p>
                      <p className="mt-0.5 text-xs text-ink-faint">{timeAgo(since, locale, t)} · {units} {units === 1 ? t("admin.orders.item") : t("admin.orders.items")}</p>
                    </div>
                    <div className="shrink-0 space-y-1 text-right">
                      <p className="font-display text-lg font-extrabold tabular-nums">{formatMzn(order.totalMzn)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                  {waiting && <p className="mt-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs font-semibold text-warning">{t("admin.orders.waitingConfirm")}</p>}
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-4 border-t border-border pt-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-ink-muted">{t("admin.orders.itemsTitle")}</p>
                      {(order.items ?? []).map((item) => (
                        <div key={item.id} className="flex justify-between gap-3 text-sm">
                          <span className="min-w-0">{item.quantity}× {item.productName}{(item.variantLabel || item.variantSize || item.variantColorHex) && <span className="block text-xs text-ink-muted">{item.variantLabel ?? [item.variantColorHex, item.variantSize].filter(Boolean).join(" · ")}</span>}</span>
                          <span className="shrink-0 tabular-nums text-ink-muted">{formatMzn(item.subtotalMzn)}</span>
                        </div>
                      ))}
                      <p className="pt-1 font-mono text-[11px] text-ink-faint">{order.orderNumber}</p>
                    </div>

                    {payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-ink-muted">{t("admin.orders.payment")}</p>
                        {payments.map((p) => <PaymentBlock key={p.id} order={order} payment={p} t={t} locale={locale} />)}
                      </div>
                    )}

                    {options.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <select value={pendingStatus[order.id] ?? ""} onChange={(e) => setPendingStatus((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))} aria-label={t("admin.orders.status")}
                          className="min-h-[40px] rounded-lg border border-border bg-elevated px-2.5 text-sm focus:border-primary focus:outline-none">
                          <option value="">{t("admin.orders.changeTo")}</option>
                          {options.map((s) => <option key={s} value={s}>{orderStatusLabel[locale][s]}</option>)}
                        </select>
                        <Button variant="secondary" onClick={() => (CONFIRM_STATUSES.includes(pendingStatus[order.id] as OrderStatus) ? setConfirmStatus(order) : applyStatus(order))} disabled={!pendingStatus[order.id]}>{t("common.save")}</Button>
                      </div>
                    )}

                    {token && TRACKABLE.includes(order.status) && (
                      <OrderTrackingForm order={order} token={token} onUpdated={(u) => setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, ...u } : o)) ?? null)} />
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {canMore && <Button variant="secondary" className="mt-4 w-full" loading={loadingMore} onClick={() => { setLoadingMore(true); setLimit((l) => l + MORE); }}>{t("admin.seeMore")}</Button>}

      {confirmStatus && pendingStatus[confirmStatus.id] && (
        <ConfirmDialog
          title={t("admin.orders.confirmStatusTitle")}
          message={`${t("admin.orders.confirmStatus")} «${orderStatusLabel[locale][pendingStatus[confirmStatus.id] as OrderStatus]}».`}
          confirmLabel={t("common.save")}
          danger
          onClose={() => setConfirmStatus(null)}
          onConfirm={async () => { await applyStatus(confirmStatus); setConfirmStatus(null); }}
        />
      )}
    </div>
  );
}
