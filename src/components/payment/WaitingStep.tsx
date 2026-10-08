import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import { formatCountdown, maskPhone } from "@/lib/payments";
import type { PaymentView } from "@/lib/types";
import { Button } from "../ui/Button";
import { PhoneIcon } from "../icons";

// Ecrã de espera: o cliente está a confirmar no telemóvel. Nada de celebração aqui — só quando o servidor disser "success".
export function WaitingStep({ payment, offline, onChangeMethod }: { payment: PaymentView; offline: boolean; onChangeMethod: () => unknown }) {
  const { t } = useLocale();
  const isCard = payment.method === "CARD";
  const method = payment.method === "EMOLA" ? "EMOLA" : "MPESA";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = payment.expiresAt ? new Date(payment.expiresAt).getTime() - now : null;

  return (
    <section className="flex flex-col items-center pt-4 text-center" aria-live="polite">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span className="pay-ring absolute inset-0 rounded-full bg-primary/30" aria-hidden="true" />
        <span className="pay-ring absolute inset-0 rounded-full bg-primary/30" aria-hidden="true" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white"><PhoneIcon width={34} height={34} /></span>
      </div>

      <h1 className="mt-7 font-display text-2xl font-extrabold">{t(isCard ? "pay.waiting.card.title" : "pay.waiting.title")}</h1>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">
        {isCard
          ? t("pay.waiting.card.body")
          : <>{t("pay.waiting.sentTo")} <span className="font-semibold text-ink">{maskPhone(payment.paymentNumber)}</span>. {t(`pay.waiting.body.${method}`)}</>}
      </p>
      <p className="mt-4 font-display text-3xl font-extrabold tabular-nums">{formatMzn(payment.amountMzn)}</p>

      {!isCard && (
        <ol className="mt-6 w-full space-y-2 rounded-2xl border border-border bg-surface p-4 text-left text-sm">
          {["pay.waiting.step1", "pay.waiting.step2", "pay.waiting.step3"].map((key, i) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold text-ink-muted">{i + 1}</span>
              <span className={i === 2 ? "font-semibold" : "text-ink-muted"}>{t(key)}</span>
            </li>
          ))}
        </ol>
      )}

      {method === "EMOLA" && !isCard && <p className="mt-3 text-xs text-ink-muted">{t("pay.waiting.emola")}</p>}

      <p className="mt-5 text-xs text-ink-faint">{t("pay.waiting.dontClose")}</p>
      {remaining !== null && remaining > 0 && <p className="mt-1 text-xs text-ink-faint">{t("pay.waiting.expires")} <span className="font-mono font-semibold text-ink-muted">{formatCountdown(remaining)}</span></p>}
      {remaining !== null && remaining <= 0 && <p className="mt-1 text-xs text-ink-faint">{t("pay.waiting.checking")}</p>}
      {offline && <p role="status" className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">{t("pay.waiting.offline")}</p>}

      <Button variant="ghost" className="mt-6" onClick={onChangeMethod}>{t("pay.waiting.change")}</Button>
    </section>
  );
}
