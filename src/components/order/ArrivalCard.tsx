import { useLocale } from "@/i18n/LocaleContext";

// Dias de calendário entre hoje e a data (no fuso do telemóvel): 0 = hoje, 1 = amanhã, negativo = já passou.
function calendarDays(target: Date, now: Date): number {
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

// A primeira coisa que o cliente quer saber de uma encomenda paga: quanto falta para chegar.
// Com data estimada pela loja mostra essa; sem ela mostra o prazo máximo (contado desde a confirmação do pagamento, vem do servidor).
export function ArrivalCard({ estimatedAt, deadlineAt }: { estimatedAt: string | null | undefined; deadlineAt: string | null | undefined }) {
  const { t, locale } = useLocale();
  if (!estimatedAt && !deadlineAt) return null;
  const now = new Date();
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const unit = (n: number) => t(n === 1 ? "order.arrival.day" : "order.arrival.days");

  const days = calendarDays(new Date((estimatedAt ?? deadlineAt) as string), now);
  const headline = days < 0 ? t("order.arrival.late")
    : estimatedAt
      ? (days === 0 ? t("order.arrival.today") : days === 1 ? t("order.arrival.tomorrow") : `${t("order.arrival.in")} ${days} ${unit(days)}`)
      : `${t("order.arrival.upTo")} ${days} ${unit(days)}`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="font-display text-2xl font-extrabold leading-tight">{headline}</p>
      <dl className="mt-2 space-y-1 text-sm text-ink-muted">
        <div>{estimatedAt ? <><dt className="inline">{t("order.track.eta")}: </dt><dd className="inline font-semibold capitalize text-ink">{fmt(estimatedAt)}</dd></> : <dd>{t("order.arrival.noDate")}</dd>}</div>
        {deadlineAt && <div><dt className="inline">{t("order.arrival.limit")}: </dt><dd className="inline tabular-nums">{new Date(deadlineAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</dd></div>}
      </dl>
    </div>
  );
}
