import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button, buttonClass } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { ClipboardIcon, DocumentIcon } from "@/components/icons";
import { useAuth } from "@/auth/AuthContext";
import { shortOrder } from "@/lib/orderNumber";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { saveBlob } from "@/lib/download";
import { formatMzn } from "@/lib/format";
import { formatCountdown } from "@/lib/payments";
import { useCountdown } from "@/lib/useCountdown";
import type { OrderSummary, OrderTab } from "@/lib/types";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

const PAGE_SIZE = 10;
const TABS: OrderTab[] = ["all", "wallet", "p2p", "refused"];
// Só os separadores que pedem atenção mostram quantas encomendas têm.
const COUNTED: OrderTab[] = ["p2p", "refused"];

// Uma encomenda a aguardar pagamento: o tempo que falta vem do servidor (começa quando o pedido é enviado).
function OrderRow({ order, serverNow, onDownload }: { order: OrderSummary; serverNow: string | null; onDownload: (order: OrderSummary) => void }) {
  const { t, locale } = useLocale();
  const remaining = useCountdown(order.paymentDeadline, serverNow);
  const awaiting = order.status === "PENDING_PAYMENT";
  const timeUp = awaiting && remaining !== null && remaining <= 0;
  const expired = order.expired || timeUp;
  const canPay = awaiting && !expired;
  const fmtDate = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const extra = order._count.items - order.items.length;
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <Link to={`/encomenda/${order.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold" title={order.orderNumber}>{shortOrder(order.orderNumber)}</p>
            <p className="text-xs text-ink-faint">{fmtDate.format(new Date(order.createdAt))}</p>
          </div>
          {expired ? <Badge tone="danger">{t("orders.phase.expired")}</Badge>
            : order.phase === "refused" ? <Badge tone="danger">{t("orders.phase.refused")}</Badge>
            : <OrderStatusBadge status={order.status} />}
        </div>
        <p className="mt-2 truncate text-sm text-ink-muted">
          {order.items.map((item) => `${item.quantity}× ${item.productName}`).join(", ")}{extra > 0 ? ` +${extra}` : ""}
        </p>
        <p className="mt-1 font-display text-lg font-extrabold tabular-nums">{formatMzn(order.totalMzn)}</p>
      </Link>

      {canPay && remaining !== null && (
        <>
          <p className={`mt-3 text-sm font-semibold tabular-nums ${remaining < 5 * 60_000 ? "text-danger" : "text-warning"}`}>
            {t("orders.payIn")} {formatCountdown(remaining)}
          </p>
          <Link to={`/pagamento/${order.id}`} className={buttonClass("primary", "md", "mt-2 w-full")}>
            {t(order.phase === "refused" ? "orders.retry" : "pay.pending.cta")}
          </Link>
        </>
      )}
      {awaiting && expired && !order.expired && <p className="mt-3 text-sm text-ink-muted">{t("orders.phase.paymentClosed")}</p>}

      {order.invoice && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => onDownload(order)}>
          <DocumentIcon width={16} height={16} />{t("orders.invoice")} · {order.invoice.invoiceNumber}
        </Button>
      )}
    </li>
  );
}

// "Meus pedidos": Todos = Carteira + P2P (+ o resto). Carteira = pago e confirmado; P2P = em espera ou expirada; Recusadas.
// O servidor decide em que separador cai cada encomenda (services/orderTabs.ts): aqui só se desenha.
export default function OrdersPage() {
  const { t, locale } = useLocale();
  const { token } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  // "?faturas=1" era o filtro antigo "Com fatura": é o mesmo que Carteira.
  const requested = params.get("separador") ?? (params.get("faturas") === "1" ? "wallet" : "all");
  const tab: OrderTab = TABS.includes(requested as OrderTab) ? (requested as OrderTab) : "all";
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [counts, setCounts] = useState<Record<OrderTab, number> | null>(null);
  const [serverNow, setServerNow] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  useDocumentMeta({ title: `${t("orders.title")} · Twisisa Market`, noindex: true });

  const fetchPage = useCallback((nextPage: number) => {
    if (!token) return Promise.resolve();
    return api.orders.list(token, { page: nextPage, limit: PAGE_SIZE, tab })
      .then((res) => {
        setOrders((current) => (nextPage === 1 ? res.data : [...(current ?? []), ...res.data]));
        setTotal(res.pagination.total);
        setCounts(res.counts);
        setServerNow(res.serverNow);
        setPage(nextPage);
        setError(false);
      })
      .catch(() => setError(true));
  }, [token, tab]);

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

  const pillClass = (active: boolean) => `press flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${active ? "bg-primary text-white" : "border border-border text-ink-muted hover:text-ink"}`;
  const emptyKey = tab === "all" ? "orders.empty" : `orders.empty.${tab}`;

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-4">
        <h1 className="mb-3 text-2xl font-bold">{t("orders.title")}</h1>
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 no-scrollbar" role="group" aria-label={t("orders.title")}>
          {TABS.map((id) => (
            <button key={id} type="button" aria-pressed={tab === id} className={pillClass(tab === id)} onClick={() => setParams(id === "all" ? {} : { separador: id }, { replace: true })}>
              {t(`orders.tab.${id}`)}
              {COUNTED.includes(id) && counts && counts[id] > 0 && <span className={`text-xs tabular-nums ${tab === id ? "text-white/80" : "text-ink-faint"}`}>{counts[id]}</span>}
            </button>
          ))}
        </div>

        {error && orders === null && (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-ink-muted">{t("common.error")}</p>
            <Button className="mt-4" variant="secondary" onClick={() => { setError(false); void fetchPage(1); }}>{t("common.retry")}</Button>
          </div>
        )}

        {!error && orders === null && <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>}

        {orders !== null && orders.length === 0 && <div className="orders-empty flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/60 px-4 py-5 sm:px-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated text-ink-faint"><ClipboardIcon width={21} height={21} /></span>
          <div className="min-w-0"><p className="text-sm font-semibold">{t(emptyKey)}</p><p className="mt-1 text-xs leading-relaxed text-ink-muted">{tab === "all" ? (t("orders.emptyHint") === "orders.emptyHint" ? "As suas encomendas aparecerão aqui quando fizer uma compra." : t("orders.emptyHint")) : (t("orders.emptyHint") === "orders.emptyHint" ? "Não existem encomendas nesta categoria neste momento." : t("orders.emptyHint"))}</p></div>
          <Link to="/pesquisa" className="ml-auto shrink-0 text-xs font-bold text-primary-text">{locale === "pt" ? "Ver produtos" : "Browse products"}</Link>
        </div>}

        {orders !== null && orders.length > 0 && (
          <ul className="space-y-2">
            {orders.map((order) => <OrderRow key={order.id} order={order} serverNow={serverNow} onDownload={download} />)}
          </ul>
        )}

        {orders !== null && orders.length < total && (
          <Button variant="secondary" className="mt-4 w-full" loading={loadingMore} onClick={loadMore}>{t("orders.loadMore")}</Button>
        )}
      </main>
    </div>
  );
}
