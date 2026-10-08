import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { ClipboardIcon, DocumentIcon } from "@/components/icons";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { saveBlob } from "@/lib/download";
import { formatMzn } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

const PAGE_SIZE = 10;

// "Meus pedidos" e "Faturas": a mesma lista, com um filtro. O servidor só devolve as encomendas do próprio cliente.
export default function OrdersPage() {
  const { t, locale } = useLocale();
  const { token } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const invoicedOnly = params.get("faturas") === "1";
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  useDocumentMeta({ title: `${t(invoicedOnly ? "orders.invoices" : "orders.title")} · Twisisa Market`, noindex: true });

  const fetchPage = useCallback((nextPage: number) => {
    if (!token) return Promise.resolve();
    return api.orders.list(token, { page: nextPage, limit: PAGE_SIZE, invoiced: invoicedOnly || undefined })
      .then((res) => {
        setOrders((current) => (nextPage === 1 ? res.data : [...(current ?? []), ...res.data]));
        setTotal(res.pagination.total);
        setPage(nextPage);
        setError(false);
      })
      .catch(() => setError(true));
  }, [token, invoicedOnly]);

  useEffect(() => {
    setOrders(null);
    void fetchPage(1);
  }, [fetchPage]);

  async function loadMore() {
    setLoadingMore(true);
    await fetchPage(page + 1);
    setLoadingMore(false);
  }

  async function download(order: OrderSummary) {
    if (!token || !order.invoice) return;
    try {
      saveBlob(await api.invoices.downloadPdf(order.invoice.id, token), `${order.invoice.invoiceNumber}.pdf`);
    } catch {
      toast.show(t("toast.invoiceError"), { tone: "error", key: "invoice" });
    }
  }

  const fmtDate = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const filterClass = (active: boolean) => `press flex h-9 items-center rounded-full px-4 text-sm font-semibold ${active ? "bg-primary text-white" : "border border-border text-ink-muted hover:text-ink"}`;

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-4">
        <h1 className="mb-3 text-2xl font-bold">{t("orders.title")}</h1>
        <div className="mb-4 flex gap-2" role="group" aria-label={t("orders.title")}>
          <button type="button" aria-pressed={!invoicedOnly} className={filterClass(!invoicedOnly)} onClick={() => setParams({}, { replace: true })}>{t("orders.filterAll")}</button>
          <button type="button" aria-pressed={invoicedOnly} className={filterClass(invoicedOnly)} onClick={() => setParams({ faturas: "1" }, { replace: true })}>{t("orders.filterInvoiced")}</button>
        </div>

        {error && orders === null && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-ink-muted">{t("common.error")}</p>
            <Button className="mt-4" variant="secondary" onClick={() => { setError(false); void fetchPage(1); }}>{t("common.retry")}</Button>
          </div>
        )}

        {!error && orders === null && <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>}

        {orders !== null && orders.length === 0 && (
          <EmptyState title={t(invoicedOnly ? "orders.emptyInvoices" : "orders.empty")} icon={<ClipboardIcon width={26} height={26} />} />
        )}

        {orders !== null && orders.length > 0 && (
          <ul className="space-y-2">
            {orders.map((order) => {
              const extra = order._count.items - order.items.length;
              return (
                <li key={order.id} className="rounded-2xl border border-border bg-surface p-4">
                  <Link to={`/encomenda/${order.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">#{order.orderNumber}</p>
                        <p className="text-xs text-ink-faint">{fmtDate.format(new Date(order.createdAt))}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 truncate text-sm text-ink-muted">
                      {order.items.map((item) => `${item.quantity}× ${item.productName}`).join(", ")}{extra > 0 ? ` +${extra}` : ""}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold tabular-nums">{formatMzn(order.totalMzn)}</p>
                  </Link>
                  {order.status === "PENDING_PAYMENT" && (
                    <Link to={`/pagamento/${order.id}`} className={buttonClass("primary", "md", "mt-3 w-full")}>{t("pay.pending.cta")}</Link>
                  )}
                  {order.invoice && (
                    <Button variant="secondary" size="sm" className="mt-3" onClick={() => download(order)}>
                      <DocumentIcon width={16} height={16} />{t("orders.invoice")} · {order.invoice.invoiceNumber}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {orders !== null && orders.length < total && (
          <Button variant="secondary" className="mt-4 w-full" loading={loadingMore} onClick={loadMore}>{t("orders.loadMore")}</Button>
        )}
      </main>
    </div>
  );
}
