import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import type { PaymentView } from "@/lib/types";
import { Button } from "../ui/Button";
import { CheckIcon } from "../icons";

// Comprovativo enviado: a loja confirma contra o extrato. O cliente pode sair; é avisado por notificação.
export function ReviewStep({ payment, offline, onOrder }: { payment: PaymentView; offline: boolean; onOrder: () => void }) {
  const { t } = useLocale();
  return (
    <section className="flex flex-col items-center pt-6 text-center" aria-live="polite">
      <span className="pop flex h-20 w-20 items-center justify-center rounded-full bg-warning/15 text-warning"><CheckIcon width={36} height={36} /></span>
      <h1 className="mt-6 font-display text-2xl font-extrabold">{t("pay.review.title")}</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">{t("pay.review.body")}</p>
      <dl className="mt-6 w-full space-y-2.5 rounded-2xl border border-border bg-surface p-4 text-left text-sm">
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.success.amount")}</dt><dd className="font-display font-extrabold tabular-nums">{formatMzn(payment.amountMzn)}</dd></div>
        {payment.payerName && <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.manual.payWith")}</dt><dd className="min-w-0 truncate text-right font-semibold">{payment.payerName}{payment.paymentNumber ? ` · ${payment.paymentNumber}` : ""}</dd></div>}
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.manual.reference")}</dt><dd className="font-mono text-xs font-semibold">{payment.reference}</dd></div>
      </dl>
      <p className="mt-4 text-xs text-ink-faint">{t("pay.review.leave")}</p>
      {offline && <p role="status" className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">{t("pay.waiting.offline")}</p>}
      <Button size="lg" variant="secondary" className="mt-6 w-full" onClick={onOrder}>{t("pay.viewOrder")}</Button>
    </section>
  );
}
