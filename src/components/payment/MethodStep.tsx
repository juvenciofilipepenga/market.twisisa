import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import { img } from "@/lib/images";
import { cleanPhone, METHOD_ORDER, PHONE_RULES } from "@/lib/payments";
import type { ManualDetails, OnlineStatus, PaymentMethodId } from "@/lib/types";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { CheckIcon, ShieldIcon } from "../icons";
import { MethodLogo } from "./PaymentShell";

export const LOGO: Record<PaymentMethodId, string> = { MPESA: img.payMpesa, EMOLA: img.payEmola, CARD: img.payCard };
export const NAME: Record<PaymentMethodId, string> = { MPESA: "M-Pesa", EMOLA: "e-Mola", CARD: "Visa / Mastercard" };

/** Métodos manuais disponíveis = os que têm destino preenchido no admin. */
export function manualMethods(manual: ManualDetails | null | undefined): Array<"MPESA" | "EMOLA"> {
  if (!manual?.enabled) return [];
  return (["MPESA", "EMOLA"] as const).filter((m) => (m === "MPESA" ? manual.mpesa : manual.emola));
}

export function phoneValid(method: PaymentMethodId, phone: string): boolean {
  return method === "CARD" || PHONE_RULES[method].test(phone);
}
export const nameValid = (name: string) => name.trim().length >= 2;

interface Props {
  orderNumber: string;
  total: string;
  itemCount: number;
  available: PaymentMethodId[] | null; // métodos online realmente disponíveis (null = ainda a carregar)
  onlineStatus: OnlineStatus;
  manual: ManualDetails | null;
  /** "manual" = pagar para a conta da loja (número e nome de quem paga, 5 min). */
  mode: "online" | "manual";
  onMode: (mode: "online" | "manual") => void;
  sandbox: boolean;
  method: PaymentMethodId;
  onMethod: (m: PaymentMethodId) => void;
  phone: string;
  onPhone: (p: string) => void;
  payerName: string;
  onPayerName: (n: string) => void;
  touched: boolean;
  paying: boolean;
  onPay: () => unknown;
}

export function MethodStep({ orderNumber, total, itemCount, available, onlineStatus, manual, mode, onMode, sandbox, method, onMethod, phone, onPhone, payerName, onPayerName, touched, paying, onPay }: Props) {
  const { t } = useLocale();
  const isManual = mode === "manual";
  const manualOptions = manualMethods(manual);
  const onlineOptions = METHOD_ORDER.filter((m) => !available || available.includes(m));
  const options: PaymentMethodId[] = isManual ? manualOptions : onlineOptions;
  const onlineDown = onlineStatus !== "ok" || (available !== null && available.length === 0);
  const needsPhone = method !== "CARD";
  const phoneBad = needsPhone && touched && !phoneValid(method, phone);
  const nameBad = isManual && touched && !nameValid(payerName);
  const canContinue = (!needsPhone || phoneValid(method, phone)) && (!isManual || nameValid(payerName));

  if (options.length === 0 && manualOptions.length === 0) {
    return <p role="alert" className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-ink-muted">{t("pay.unavailable")}</p>;
  }

  return (
    <>
      <section className="text-center">
        <p className="text-sm text-ink-muted">{t("pay.toPay")}</p>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{formatMzn(total)}</p>
        <p className="mt-1.5 text-xs text-ink-faint">{t("pay.order")} {orderNumber} · {itemCount} {itemCount === 1 ? "artigo" : "artigos"}</p>
      </section>

      {onlineDown && manualOptions.length > 0 && <p role="status" className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm text-warning">{t("pay.onlineDown")}</p>}
      {sandbox && !isManual && <p className="mt-5 rounded-xl border border-sun/40 bg-sun/10 px-3 py-2 text-xs text-sun">{t("pay.sandbox")}</p>}

      <h1 className="mb-3 mt-7 text-base font-bold">{t("pay.chooseMethod")}</h1>
      <div role="radiogroup" aria-label={t("pay.chooseMethod")} className="space-y-2">
        {options.map((m) => {
          const selected = method === m;
          return (
            <button key={m} type="button" role="radio" aria-checked={selected} onClick={() => onMethod(m)}
              className={`press flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${selected ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-ink-faint"}`}>
              <MethodLogo src={LOGO[m]} alt="" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{NAME[m]}</span>
                <span className="block text-xs text-ink-muted">{isManual ? t("pay.manual.tileDesc") : t(`pay.desc.${m}`)}</span>
              </span>
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
                {selected && <CheckIcon width={14} height={14} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {needsPhone ? (
          <Field
            label={t(isManual ? `pay.manual.phone.${method}` : `pay.phone.${method}`)}
            hint={t(`pay.phoneHelp.${method}`)}
            error={phoneBad ? t(`pay.phoneInvalid.${method}`) : null}
            type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="84 123 4567" maxLength={12}
            value={phone} onChange={(e) => onPhone(cleanPhone(e.target.value))}
          />
        ) : (
          <p className="rounded-xl bg-elevated px-3 py-2.5 text-sm text-ink-muted">{t("pay.cardRedirect")}</p>
        )}
        {isManual && (
          <Field label={t("pay.manual.nameLabel")} hint={t("pay.manual.nameHelp")} error={nameBad ? t("pay.manual.nameInvalid") : null}
            autoComplete="name" maxLength={80} value={payerName} onChange={(e) => onPayerName(e.target.value)} />
        )}
      </div>

      {/* Alternar entre automático e pagar diretamente para a conta da loja */}
      {!isManual && manualOptions.length > 0 && <button type="button" onClick={() => onMode("manual")} className="press mt-4 w-full text-center text-sm font-medium text-primary underline-offset-2 hover:underline">{t("pay.manual.switchToManual")}</button>}
      {isManual && !onlineDown && onlineOptions.length > 0 && <button type="button" onClick={() => onMode("online")} className="press mt-4 w-full text-center text-sm font-medium text-primary underline-offset-2 hover:underline">{t("pay.manual.switchToOnline")}</button>}

      <ul className="mt-6 space-y-2 text-xs text-ink-muted">
        {(isManual ? ["pay.manual.trust1", "pay.manual.trust2", "pay.manual.trust3"] : ["pay.trust1", "pay.trust2", "pay.trust3"]).map((key) => (
          <li key={key} className="flex items-start gap-2"><ShieldIcon width={14} height={14} className="mt-0.5 shrink-0 text-success" />{t(key)}</li>
        ))}
      </ul>

      {/* Botão fixo em baixo: sempre ao alcance do polegar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button size="lg" className="w-full" loading={paying} disabled={!canContinue} onClick={onPay}>
            {isManual ? t("pay.manual.continue") : `${t("pay.payNow")} ${formatMzn(total)}`}
          </Button>
        </div>
      </div>
    </>
  );
}
