import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orderStatus";
import { shortOrder } from "@/lib/orderNumber";
import type { AdminHistoryItem } from "@/lib/types";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

const DOT: Record<string, string> = { PAID: "bg-success", SHIPPED: "bg-sun", DELIVERED: "bg-success", CANCELLED: "bg-danger", REFUNDED: "bg-ink-faint" };

// Histórico mais abaixo no painel: o que já aconteceu (pago, enviado, entregue, cancelado). 10 de cada vez.
export function HistoryList({ token }: { token: string }) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<AdminHistoryItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (next: number) => {
    setLoading(true);
    try {
      const res = await api.admin.history(token, next, 10);
      setItems((prev) => (next === 1 ? res.items : [...(prev ?? []), ...res.items]));
      setHasMore(res.hasMore);
      setPage(next);
    } catch {
      setItems((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(1); }, [load]);

  const fmt = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-1 text-sm font-bold text-ink-muted">{t("admin.history")}</h2>
      {items === null && <Skeleton className="h-32 w-full" />}
      {items?.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">{t("admin.history.empty")}</p>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-border">
          {items.map((h) => (
            <li key={h.id} className="flex items-start justify-between gap-3 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[h.status] ?? "bg-ink-faint"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{orderStatusLabel[locale][h.status]}</p>
                  <p className="truncate text-xs text-ink-muted">
                    <Link to={`/admin/pedidos?q=${encodeURIComponent(h.orderNumber)}`} title={h.orderNumber} className="hover:text-ink">{shortOrder(h.orderNumber)}</Link> · {h.customer}
                  </p>
                  <p className="text-xs text-ink-faint">{fmt.format(new Date(h.at))}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMzn(h.totalMzn)}</p>
            </li>
          ))}
        </ul>
      )}
      {hasMore && <Button variant="secondary" className="mt-3 w-full" loading={loading} onClick={() => load(page + 1)}>{t("admin.seeMore")}</Button>}
    </section>
  );
}
