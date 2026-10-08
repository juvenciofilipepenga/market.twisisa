import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import { img } from "@/lib/images";
import { cleanPhone, METHOD_ORDER, PHONE_RULES } from "@/lib/payments";
import type { PaymentMethodId } from "@/lib/types";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { CheckIcon, ShieldIcon } from "../icons";
import { MethodLogo } from "./PaymentShell";

const LOGO: Record<PaymentMethodId, string> = { MPESA: img.payMpesa, EMOLA: img.payEmola, CARD: img.payCard };
const NAME: Record<PaymentMethodId, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola", CARD: "Visa / Mastercard" };

interface Props {
  orderNumber: string;
  total: string;
  itemCount: number;
  available: PaymentMethodId[] | null; // null = ainda a carregar / desconhecido (mostra todos)
  sandbox: boolean;
  method: PaymentMethodId;
  onMethod: (m: PaymentMethodId) => void;
  phone: string;
  onPhone: (p: string) => void;
  phoneTouched: boolean;
  paying: boolean;
  onPay: () => unknown;
}

export function phoneValid(method: PaymentMethodId, phone: string): boolean {
  return method === "CARD" || PHONE_RULES[method].test(phone);
}

export function MethodStep({ orderNumber, total, itemCount, available, sandbox, method, onMethod, phone, onPhone, phoneTouched, paying, onPay }: Props) {
  const { t } = useLocale();
  const methods = METHOD_ORDER.filter((m) => !available || available.includes(m));
  const needsPhone = method !== "CARD";
  const valid = phoneValid(method, phone);
  const phoneError = needsPhone && phoneTouched && !valid ? t(`pay.phoneInvalid.${method}`) : null;

  if (available && methods.length === 0) {
    return <p role="alert" className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-ink-muted">{t("pay.unavailable")}</p>;
  }

  return (
    <>
      <section className="text-center">
        <p className="text-sm text-ink-muted">{t("pay.toPay")}</p>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{formatMzn(total)}</p>
        <p className="mt-1.5 text-xs text-ink-faint">{t("pay.order")} {orderNumber} · {itemCount} {itemCount === 1 ? "artigo" : "artigos"}</p>
      </section>

      {sandbox && <p className="mt-5 rounded-xl border border-sun/40 bg-sun/10 px-3 py-2 text-xs text-sun">{t("pay.sandbox")}</p>}

      <h1 className="mb-3 mt-7 text-base font-bold">{t("pay.chooseMethod")}</h1>
      <div role="radiogroup" aria-label={t("pay.chooseMethod")} className="space-y-2">
        {methods.map((m) => {
          const selected = method === m;
          return (
            <button key={m} type="button" role="radio" aria-checked={selected} onClick={() => onMethod(m)}
              className={`press flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${selected ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-ink-faint"}`}>
              <MethodLogo src={LOGO[m]} alt="" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{NAME[m]}</span>
                <span className="block text-xs text-ink-muted">{t(`pay.desc.${m}`)}</span>
              </span>
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
                {selected && <CheckIcon width={14} height={14} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {needsPhone ? (
          <Field
            label={t(`pay.phone.${method}`)}
            hint={t(`pay.phoneHelp.${method}`)}
            error={phoneError}
            type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="84 123 4567" maxLength={12}
            value={phone}
            onChange={(e) => onPhone(cleanPhone(e.target.value))}
          />
        ) : (
          <p className="rounded-xl bg-elevated px-3 py-2.5 text-sm text-ink-muted">{t("pay.cardRedirect")}</p>
        )}
      </div>

      <ul className="mt-6 space-y-2 text-xs text-ink-muted">
        {["pay.trust1", "pay.trust2", "pay.trust3"].map((key) => (
          <li key={key} className="flex items-start gap-2"><ShieldIcon width={14} height={14} className="mt-0.5 shrink-0 text-success" />{t(key)}</li>
        ))}
      </ul>

      {/* Botão fixo em baixo: sempre ao alcance do polegar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button size="lg" className="w-full" loading={paying} disabled={needsPhone && !valid} onClick={onPay}>
            {t("pay.payNow")} {formatMzn(total)}
          </Button>
        </div>
      </div>
    </>
  );
}
