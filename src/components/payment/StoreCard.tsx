import { useLocale } from "@/i18n/LocaleContext";
import { formatMzn } from "@/lib/format";
import type { PaymentMethodId } from "@/lib/types";
import { ClipboardIcon } from "../icons";
import { useToast } from "../ui/Toast";
import { LOGO, NAME } from "./MethodStep";
import { MethodLogo } from "./PaymentShell";

export const spaced = (n: string) => n.replace(/^(\d{2})(\d{3})(\d{4})$/, "$1 $2 $3");
export const plainAmount = (v: string) => String(Number(v));

function Row({ label, value, copy }: { label: string; value: string; copy?: string }) {
  const { t } = useLocale();
  const toast = useToast();
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="truncate font-mono text-lg font-bold tracking-wide">{value}</p>
      </div>
      {copy && (
        <button type="button" onClick={() => void navigator.clipboard?.writeText(copy).then(() => toast.show(t("pay.manual.copied"), { key: "copied" })).catch(() => undefined)}
          className="press flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-elevated px-3 text-xs font-semibold hover:border-ink-faint">
          <ClipboardIcon width={14} height={14} />{t("pay.manual.copy")}
        </button>
      )}
    </div>
  );
}

// O cartão da loja: PARA QUEM e PARA ONDE pagar, e quanto. É o ponto de confiança do pagamento manual: tem de ser claro e conferível.
export function StoreCard({ method, storeName, storeNumber, amount, withCopy }: { method: PaymentMethodId; storeName: string | null; storeNumber: string; amount: string; withCopy: boolean }) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 pt-3">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <MethodLogo src={LOGO[method]} alt="" />
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">{t("pay.manual.payTo")}</p>
          <p className="truncate text-base font-bold">{storeName || NAME[method]}</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        <Row label={`${NAME[method]} · ${t("pay.manual.numberLabel")}`} value={spaced(storeNumber)} copy={withCopy ? storeNumber : undefined} />
        <Row label={t("pay.manual.amountLabel")} value={formatMzn(amount)} copy={withCopy ? plainAmount(amount) : undefined} />
      </div>
    </div>
  );
}
