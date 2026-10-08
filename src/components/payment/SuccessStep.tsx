import { Confetti } from "../fx/Confetti";
import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import type { Invoice, PaymentView } from "@/lib/types";
import { Button } from "../ui/Button";
import { DownloadIcon } from "../icons";

const NAME: Record<string, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola", CARD: "Visa / Mastercard" };

// Só chega aqui quando o servidor confirmou o pagamento com o ZumboPay. `celebrate` = viu a confirmação acontecer agora
// (confetti uma vez); quem volta mais tarde a uma encomenda já paga vê a mesma confirmação, calma.
export function SuccessStep({ payment, invoice, celebrate, onTrack, onInvoice }: { payment: PaymentView; invoice: Invoice | null; celebrate: boolean; onTrack: () => void; onInvoice: () => unknown }) {
  const { t } = useLocale();
  return (
    <section className="flex flex-col items-center pt-6 text-center" aria-live="polite">
      {celebrate && <Confetti />}
      <span className="pop flex h-24 w-24 items-center justify-center rounded-full bg-success/15">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pay-check" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
      <h1 className="mt-6 font-display text-3xl font-extrabold">{t("pay.success.title")}</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">{t("pay.success.body")}</p>

      <dl className="mt-7 w-full space-y-2.5 rounded-2xl border border-border bg-surface p-4 text-left text-sm">
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.success.amount")}</dt><dd className="font-display font-extrabold tabular-nums">{formatMzn(payment.amountMzn)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.success.paidWith")}</dt><dd className="font-semibold">{NAME[payment.method ?? ""] ?? payment.method}</dd></div>
        {invoice && <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.success.invoiceNo")}</dt><dd className="font-mono text-xs font-semibold">{invoice.invoiceNumber}</dd></div>}
        {invoice?.paymentReference && <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.success.ref")}</dt><dd className="min-w-0 truncate font-mono text-xs">{invoice.paymentReference}</dd></div>}
      </dl>

      <div className="mt-6 w-full space-y-2">
        <Button size="lg" className="w-full" onClick={onTrack}>{t("pay.success.track")}</Button>
        {invoice && <Button size="lg" variant="secondary" className="w-full" onClick={onInvoice}><DownloadIcon width={18} height={18} />{t("pay.success.invoice")}</Button>}
        {!invoice && <p className="text-xs text-ink-faint">{t("pay.success.invoiceSoon")}</p>}
      </div>
    </section>
  );
}
