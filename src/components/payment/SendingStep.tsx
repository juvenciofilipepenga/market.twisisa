import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import { maskPhone } from "@/lib/payments";
import type { PaymentMethodId } from "@/lib/types";
import { PhoneIcon, ShieldIcon } from "../icons";

// Aparece NO MOMENTO em que o cliente carrega em "Pagar", enquanto o servidor pede ao ZumboPay para enviar o pedido.
// Assim nunca há um botão a girar sem explicação: o cliente sabe o que está a acontecer.
export function SendingStep({ method, phone, total }: { method: PaymentMethodId; phone: string; total: string }) {
  const { t } = useLocale();
  const isCard = method === "CARD";
  return (
    <section className="flex flex-col items-center pt-8 text-center" role="status" aria-live="polite">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-primary" aria-hidden="true" />
        {isCard ? <ShieldIcon width={32} height={32} className="text-primary" /> : <PhoneIcon width={32} height={32} className="text-primary" />}
      </div>
      <h1 className="mt-7 font-display text-2xl font-extrabold">{t(isCard ? "pay.sending.card.title" : "pay.sending.title")}</h1>
      {!isCard && <p className="mt-2 text-sm text-ink-muted">{t("pay.sending.to")} <span className="font-semibold text-ink">{maskPhone(phone)}</span></p>}
      <p className="mt-4 font-display text-3xl font-extrabold tabular-nums">{formatMzn(total)}</p>
      <p className="mt-5 text-xs text-ink-faint">{t("pay.sending.hint")}</p>
    </section>
  );
}
