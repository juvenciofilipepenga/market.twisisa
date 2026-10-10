import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { useAdminStats, type StatsRange } from "@/lib/useAdminStats";
import { formatMzn } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orderStatus";
import type { OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { AreaChart } from "@/components/admin/charts/AreaChart";
import { BarList } from "@/components/admin/charts/BarList";
import { Donut } from "@/components/admin/charts/Donut";

const RANGES: StatsRange[] = [7, 14, 30, 90];
const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "#F59E0B", PAYMENT_REVIEW: "#FFC145", PAID: "#3B82F6", PROCESSING: "#60A5FA",
  READY_FOR_SHIPMENT: "#818CF8", SHIPPED: "#A78BFA", OUT_FOR_DELIVERY: "#22D3EE", DELIVERED: "#3DDC84",
  CANCELLATION_REQUESTED: "#FB923C", CANCELLED: "#EF4444", REFUND_PENDING: "#F472B6", REFUNDED: "#9CA3AF"
};

function Card({ title, right, children, className = "" }: { title: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink-muted">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return <span className={`text-xs font-semibold tabular-nums ${up ? "text-success" : "text-danger"}`}>{up ? "▲" : "▼"} {Math.abs(pct)}%</span>;
}

function Kpi({ label, value, delta, loading }: { label: string; value: string; delta?: number | null; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 break-words font-display text-2xl font-extrabold leading-tight tabular-nums sm:text-3xl">{value}</p>}
      <div className="mt-1 h-4">{!loading && delta !== undefined && <Delta pct={delta} />}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { t, locale } = useLocale();
  const [days, setDays] = useState<StatsRange>(14);
  const { stats, error, live, reload, loading } = useAdminStats(token, days);
  const first = stats === null;
  const dim = loading && !first ? "opacity-60 transition-opacity" : "transition-opacity";
  const fmtTime = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDay = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { weekday: "short", day: "2-digit", month: "short" });

  if (error && first) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-ink-muted">{t("admin.loadError")}</p>
        <Button className="mt-4" variant="secondary" onClick={() => reload()}>{t("common.retry")}</Button>
      </div>
    );
  }

  const attention = stats ? [
    { key: "review", n: stats.attention.awaitingReview, label: t("admin.attn.review"), to: "/admin/pagamentos" },
    { key: "chats", n: stats.attention.openChats, label: t("admin.attn.chats"), to: "/admin/chat" },
    { key: "cancel", n: stats.attention.cancelRequests, label: t("admin.attn.cancel"), to: "/admin/pedidos?status=CANCELLATION_REQUESTED" },
    { key: "refund", n: stats.attention.refundPending, label: t("admin.attn.refund"), to: "/admin/pedidos?status=REFUND_PENDING" },
    { key: "pending", n: stats.attention.pendingPayment, label: t("admin.attn.pending"), to: "/admin/pedidos?status=PENDING_PAYMENT" },
    { key: "stock", n: stats.attention.lowStock, label: t("admin.attn.stock"), to: "/admin/produtos" }
  ].filter((a) => a.n > 0) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.greeting")} {user?.name.split(" ")[0]}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
            <span className={`inline-flex items-center gap-1.5 font-semibold ${live ? "text-success" : "text-warning"}`}>
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-success" : "bg-warning"}`} />
              {live ? t("admin.live") : t("admin.offline")}
            </span>
            {stats && <span>{t("admin.updated")} {fmtTime.format(new Date(stats.generatedAt))}</span>}
          </p>
        </div>
        <div role="group" aria-label={t("admin.dash.period")} className="flex rounded-xl border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
              className={`press h-8 rounded-lg px-3 text-xs font-semibold ${days === r ? "bg-primary text-white" : "text-ink-muted hover:text-ink"}`}>{r} {t("admin.dash.days")}</button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${dim}`}>
        <Kpi label={t("admin.kpi.revenue")} value={stats ? formatMzn(stats.kpis.revenueMzn) : ""} delta={stats?.kpis.revenueDeltaPct} loading={first} />
        <Kpi label={t("admin.kpi.orders")} value={stats ? String(stats.kpis.paidOrders) : ""} delta={stats?.kpis.paidOrdersDeltaPct} loading={first} />
        <Kpi label={t("admin.kpi.ticket")} value={stats ? formatMzn(stats.kpis.averageTicketMzn) : ""} loading={first} />
        <Kpi label={t("admin.kpi.customers")} value={stats ? String(stats.kpis.newCustomers) : ""} delta={stats?.kpis.newCustomersDeltaPct} loading={first} />
      </div>
      {stats && <p className="-mt-2 text-xs text-ink-faint">{t("admin.dash.vsPrev")}{stats.kpis.paymentConversionPct !== null ? ` · ${t("admin.kpi.conversion")}: ${stats.kpis.paymentConversionPct}%` : ""}</p>}

      <div className={`grid gap-4 lg:grid-cols-3 ${dim}`}>
        <Card title={t("admin.chart.revenue")} className="lg:col-span-2">
          {first ? <Skeleton className="h-48 w-full" /> : (
            <AreaChart
              ariaLabel={t("admin.chart.revenue")}
              format={formatMzn}
              points={stats.revenueByDay.map((d) => ({ label: `${d.date.slice(8)}/${d.date.slice(5, 7)}`, value: d.revenueMzn, sub: `${fmtDay.format(new Date(`${d.date}T12:00:00Z`))} · ${d.orders} ${t("admin.chart.orders")}` }))}
            />
          )}
        </Card>

        <Card title={t("admin.attention")}>
          {first ? <Skeleton className="h-40 w-full" /> : attention.length === 0 ? (
            <p className="py-6 text-center text-sm text-success">{t("admin.attn.allClear")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((a) => (
                <li key={a.key}>
                  <Link to={a.to} className="flex min-h-[44px] items-center justify-between gap-3 py-2 text-sm hover:text-ink">
                    <span className="text-ink-muted">{a.label}</span>
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary-text">{a.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className={`grid gap-4 lg:grid-cols-2 ${dim}`}>
        <Card title={t("admin.chart.status")}>
          {first ? <Skeleton className="h-36 w-full" /> : (
            <Donut
              centerLabel={t("admin.chart.orders")}
              empty={t("admin.chart.empty")}
              slices={stats.ordersByStatus.map((s) => ({ key: s.status, label: orderStatusLabel[locale][s.status], value: s.count, color: STATUS_COLOR[s.status] }))}
            />
          )}
        </Card>
        <Card title={t("admin.chart.top")}>
          {first ? <Skeleton className="h-36 w-full" /> : (
            <BarList
              empty={t("admin.chart.empty")}
              items={stats.topProducts.map((p) => ({ key: p.name, label: p.name, value: p.revenueMzn, display: `${formatMzn(p.revenueMzn)} · ${p.units} ${t("admin.chart.units")}` }))}
            />
          )}
        </Card>
      </div>

      <Card title={t("admin.recent")} right={<Link to="/admin/pedidos" className="text-xs font-semibold text-primary-text hover:text-ink">{t("admin.nav.orders")} →</Link>} className={dim}>
        {first ? <Skeleton className="h-32 w-full" /> : stats.recentOrders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">{t("admin.chart.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">#{o.orderNumber} <span className="font-normal text-ink-muted">· {o.customer}</span></p>
                  <p className="text-xs text-ink-faint">{new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(o.createdAt))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold tabular-nums">{formatMzn(o.totalMzn)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
