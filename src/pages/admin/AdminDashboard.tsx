import { useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { useAdminStats, type StatsRange } from "@/lib/useAdminStats";
import { useAdminAttention } from "@/lib/useAdminAttention";
import { formatMzn } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AttentionBoard } from "@/components/admin/AttentionBoard";
import { HistoryList } from "@/components/admin/HistoryList";
import { AreaChart } from "@/components/admin/charts/AreaChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { BarList } from "@/components/admin/charts/BarList";

const RANGES: StatsRange[] = [7, 14, 30, 90];

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

// Ordem do painel (pensada para quem o abre de manhã): 1) o que precisa de si agora, 2) números, 3) gráficos, 4) histórico.
export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { t, locale } = useLocale();
  const [days, setDays] = useState<StatsRange>(14);
  const { stats, error, live, reload, loading } = useAdminStats(token, days);
  const attention = useAdminAttention(token);
  const first = stats === null;
  const dim = loading && !first ? "opacity-60 transition-opacity" : "transition-opacity";
  const tag = locale === "pt" ? "pt-PT" : "en-GB";
  const fmtTime = new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDay = new Intl.DateTimeFormat(tag, { weekday: "short", day: "2-digit", month: "short" });
  const dayLabel = (date: string) => `${date.slice(8)}/${date.slice(5, 7)}`;

  if (error && first && attention.error) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-ink-muted">{t("admin.loadError")}</p>
        <Button className="mt-4" variant="secondary" onClick={() => { void reload(); void attention.reload(); }}>{t("common.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      {/* 1) O que precisa de atenção: sempre primeiro. */}
      <div>
        <h2 className="mb-2 text-lg font-extrabold">{t("admin.attention")}</h2>
        {token && <AttentionBoard token={token} data={attention.data} reload={() => { void attention.reload(); void reload(); }} />}
      </div>

      {/* 2) Números do período */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-lg font-extrabold">{t("admin.dash.numbers")}</h2>
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
      {stats && <p className="-mt-3 text-xs text-ink-faint">{t("admin.dash.vsPrev")}{stats.kpis.paymentConversionPct !== null ? ` · ${t("admin.kpi.conversion")}: ${stats.kpis.paymentConversionPct}%` : ""}</p>}

      {/* 3) Gráficos de eixos (sem gráficos circulares) */}
      <div className={`grid gap-4 lg:grid-cols-2 ${dim}`}>
        <Card title={t("admin.chart.revenue")} className="lg:col-span-2">
          {first ? <Skeleton className="h-48 w-full" /> : (
            <AreaChart ariaLabel={t("admin.chart.revenue")} format={formatMzn}
              points={stats.revenueByDay.map((d) => ({ label: dayLabel(d.date), value: d.revenueMzn, sub: fmtDay.format(new Date(`${d.date}T12:00:00`)) }))} />
          )}
        </Card>
        <Card title={t("admin.chart.ordersPerDay")}>
          {first ? <Skeleton className="h-44 w-full" /> : (
            <BarChart ariaLabel={t("admin.chart.ordersPerDay")} format={(n) => `${n} ${t("admin.chart.orders")}`}
              points={stats.revenueByDay.map((d) => ({ label: dayLabel(d.date), value: d.orders, sub: fmtDay.format(new Date(`${d.date}T12:00:00`)) }))} />
          )}
        </Card>
        <Card title={t("admin.chart.top")}>
          {first ? <Skeleton className="h-44 w-full" /> : (
            <BarList empty={t("admin.chart.empty")}
              items={stats.topProducts.map((p) => ({ key: p.name, label: p.name, value: p.revenueMzn, display: `${formatMzn(p.revenueMzn)} · ${p.units} ${t("admin.chart.units")}` }))} />
          )}
        </Card>
      </div>

      {/* 4) Histórico */}
      {token && <HistoryList token={token} />}
    </div>
  );
}
