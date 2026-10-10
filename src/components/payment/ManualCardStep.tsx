import { useLocale } from "@/i18n/LocaleContext";
import type { PaymentMethodId } from "@/lib/types";
import { Button } from "../ui/Button";
import { spaced, StoreCard } from "./StoreCard";

// Passo de revisão do pagamento manual: o cliente vê PARA QUEM vai pagar antes de começar o relógio.
// Só ao carregar em "Enviar pedido" é que o pedido existe e os minutos começam a contar.
export function ManualCardStep({ method, amount, store, payerName, payerNumber, windowSeconds, busy, error, onSend, onBack }: {
  method: PaymentMethodId; amount: string; store: { number: string; name: string | null }; payerName: string; payerNumber: string;
  windowSeconds: number; busy: boolean; error: string | null; onSend: () => unknown; onBack: () => void;
}) {
  const { t } = useLocale();
  const minutes = Math.max(1, Math.round(windowSeconds / 60));
  return (
    <section>
      <h1 className="text-center font-display text-2xl font-extrabold">{t("pay.manual.previewTitle")}</h1>
      <p className="mt-1 text-center text-sm text-ink-muted">{t("pay.manual.previewSub")}</p>

      <div className="mt-5"><StoreCard method={method} storeName={store.name} storeNumber={store.number} amount={amount} withCopy={false} /></div>

      <div className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
        <p className="text-xs text-ink-muted">{t("pay.manual.payWith")}</p>
        <p className="font-semibold">{payerName} <span className="font-mono font-normal text-ink-muted">· {spaced(payerNumber)}</span></p>
      </div>

      <p className="mt-4 rounded-xl border border-primary/40 bg-primary-soft px-4 py-3 text-sm font-medium">
        {t("pay.manual.windowA")} <span className="font-bold">{minutes} min</span> {t("pay.manual.windowB")}
      </p>

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-5 space-y-2">
        <Button size="lg" className="w-full" loading={busy} onClick={onSend}>{t("pay.manual.send")}</Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>{t("pay.back")}</Button>
      </div>
    </section>
  );
}
