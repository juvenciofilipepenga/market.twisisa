import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { adminError, labelOr } from "@/lib/errors";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMzn } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES, orderStatusLabel, nextStatusOptions } from "@/lib/orderStatus";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ClipboardIcon } from "@/components/icons";
import { OrderTrackingForm, TRACKABLE } from "@/components/admin/OrderTrackingForm";

const PAGE_SIZE = 20;
// Mudanças que se fazem à mão mas custam caro enganar: pedem confirmação.
const CONFIRM_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const { t, locale } = useLocale();
  const [orders, setOrders] = useState<Order[] | null>(null);
  // O painel liga aqui com ?status=PAYMENT_REVIEW (etc.): só se aceita um estado que exista.
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get("status");
  const [status, setStatus] = useState<OrderStatus | "">(ORDER_STATUSES.includes(fromUrl as OrderStatus) ? (fromUrl as OrderStatus) : "");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, OrderStatus>>({});
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ paymentId: string; approved: boolean } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<Order | null>(null);

  function reload() {
    if (!token) return;
    setOrders(null);
    api.admin.orders.list(token, { status: status || undefined, page, limit: PAGE_SIZE })
      .then((r) => { setOrders(r.data); setTotal(r.pagination.total); })
      .catch((err) => { setOrders([]); setError(adminError(err, t)); });
  }

  useEffect(reload, [token, status, page]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function applyStatus(order: Order) {
    if (!token) return;
    const next = pendingStatus[order.id];
    if (!next) return;
    setError(null);
    try {
      const updated = await api.admin.orders.updateStatus(token, order.id, next);
      setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, ...updated } : o)) ?? null);
      setPendingStatus((prev) => { const { [order.id]: _done, ...rest } = prev; return rest; });
    } catch (err) {
      setError(adminError(err, t));
    }
  }

  async function confirmReview() {
    if (!token || !review) return;
    await api.admin.payments.review(token, review.paymentId, review.approved, reviewNote[review.paymentId]);
    setReview(null);
    reload();
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{t("admin.nav.orders")}</h1>

      <select value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ""); setPage(1); }}
        className="mb-4 w-full max-w-xs rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none">
        <option value="">{t("categories.all")}</option>
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{orderStatusLabel[locale][s]}</option>)}
      </select>

      {error && <p role="alert" className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

      {orders === null && <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>}
      {orders !== null && orders.length === 0 && <EmptyState title={t("catalog.empty")} icon={<ClipboardIcon width={24} height={24} />} />}

      {orders !== null && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => {
            const options = nextStatusOptions(order.status);
            const isOpen = expanded === order.id;
            const pendingReviewPayment = order.payments?.find((p) => p.status === "PROOF_SUBMITTED" || p.status === "UNDER_REVIEW");
            return (
              <div key={order.id} className="rounded-xl border border-border bg-surface p-3">
                <button onClick={() => setExpanded(isOpen ? null : order.id)} className="flex w-full items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.orderNumber}</p>
                    <p className="truncate text-xs text-ink-faint">{order.user?.name ?? order.userId} · {order.user?.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {pendingReviewPayment && <Badge tone="warning">{t("admin.orders.reviewProof")}</Badge>}
                    <span className="text-sm font-bold">{formatMzn(order.totalMzn)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 space-y-3 border-t border-border pt-3">
                    {(order.items ?? []).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-ink-muted">
                        <span>{item.quantity}× {item.productName}</span>
                        <span>{formatMzn(item.subtotalMzn)}</span>
                      </div>
                    ))}

                    {order.payments && order.payments.length > 0 && (
                      <div className="space-y-2 border-t border-border pt-2">
                        <p className="text-xs font-semibold text-ink-muted">{t("admin.orders.payment")}</p>
                        {order.payments.map((p) => (
                          <div key={p.id} className="rounded-lg bg-elevated p-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span>{p.provider} · {p.method ?? "—"} · {p.reference}</span>
                              <span className="font-semibold">{labelOr(t, `admin.pay.${p.status}`, p.status)}</span>
                            </div>
                            {p.proofUrl && (
                              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-primary underline">
                                {t("admin.orders.reviewProof")}
                              </a>
                            )}
                            {(p.status === "PROOF_SUBMITTED" || p.status === "UNDER_REVIEW") && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <input value={reviewNote[p.id] ?? ""} onChange={(e) => setReviewNote((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                  placeholder={t("admin.orders.note")} className="min-w-[140px] flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none" />
                                <Button variant="secondary" onClick={() => setReview({ paymentId: p.id, approved: true })}>{t("admin.orders.approve")}</Button>
                                <Button variant="danger" onClick={() => setReview({ paymentId: p.id, approved: false })}>{t("admin.orders.reject")}</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {options.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                        <select
                          value={pendingStatus[order.id] ?? ""}
                          onChange={(e) => setPendingStatus((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))}
                          className="rounded-lg border border-border bg-elevated px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                        >
                          <option value="">{t("admin.orders.status")}…</option>
                          {options.map((s) => <option key={s} value={s}>{orderStatusLabel[locale][s]}</option>)}
                        </select>
                        <Button variant="secondary" onClick={() => (CONFIRM_STATUSES.includes(pendingStatus[order.id] as OrderStatus) ? setConfirmStatus(order) : applyStatus(order))} disabled={!pendingStatus[order.id]}>
                          {t("common.save")}
                        </Button>
                      </div>
                    )}

                    {token && TRACKABLE.includes(order.status) && (
                      <OrderTrackingForm order={order} token={token} onUpdated={(u) => setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, ...u } : o)) ?? null)} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {orders !== null && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">←</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">→</button>
        </div>
      )}

      {review && (
        <ConfirmDialog
          title={t(review.approved ? "admin.orders.approveTitle" : "admin.orders.rejectTitle")}
          message={t(review.approved ? "admin.orders.approveBody" : "admin.orders.rejectBody")}
          confirmLabel={t(review.approved ? "admin.orders.approve" : "admin.orders.reject")}
          danger={!review.approved}
          onClose={() => setReview(null)}
          onConfirm={confirmReview}
        />
      )}

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
