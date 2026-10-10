import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { formatCountdown } from "@/lib/payments";
import type { PaymentMethodId, PaymentView } from "@/lib/types";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { CheckIcon } from "../icons";
import { NAME } from "./MethodStep";
import { spaced, StoreCard } from "./StoreCard";

// Pagamento manual em curso: contagem decrescente, os dados da loja (copiáveis), os 3 passos e o botão "Já paguei".
// Se o tempo acabar, o botão continua disponível (tolerância no servidor) para quem pagou no último minuto.
export function ManualStep({ payment, store, windowSeconds, busy, error, onClaim, onRestart, onChangeMethod }: {
  payment: PaymentView; store: { number: string; name: string | null }; windowSeconds: number; busy: boolean; error: string | null;
  onClaim: (code: string) => unknown; onRestart: () => void; onChangeMethod: () => unknown;
}) {
  const { t } = useLocale();
  const method: PaymentMethodId = payment.method === "EMOLA" ? "EMOLA" : "MPESA";
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const remaining = payment.expiresAt ? new Date(payment.expiresAt).getTime() - now : 0;
  const expired = remaining <= 0;
  const claimable = payment.claimUntil ? now < new Date(payment.claimUntil).getTime() : false;
  const pct = Math.max(0, Math.min(100, (remaining / (windowSeconds * 1000)) * 100));

  return (
    <section>
      <div className="text-center">
        {!expired ? (
          <>
            <p className="text-xs text-ink-muted">{t("pay.manual.left")}</p>
            <p className={`font-display text-5xl font-extrabold tabular-nums ${remaining < 60_000 ? "text-warning" : ""}`}>{formatCountdown(remaining)}</p>
            <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} /></div>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold">{t("pay.manual.expiredTitle")}</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-muted">{t(claimable ? "pay.manual.expiredBody" : "pay.manual.expiredBodyLate")}</p>
          </>
        )}
      </div>

      <div className="mt-5"><StoreCard method={method} storeName={store.name} storeNumber={store.number} amount={payment.amountMzn} withCopy /></div>

      <ol className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
        {[t(`pay.manual.step1.${method}`), t("pay.manual.step2"), t("pay.manual.step3")].map((text, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-bold text-ink-muted">{i + 1}</span>
            <span className={i === 2 ? "font-semibold" : "text-ink-muted"}>{text}</span>
          </li>
        ))}
      </ol>

      <details className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-ink-muted">{t("pay.manual.codeToggle")}</summary>
        <div className="mt-3">
          <Field label={t("pay.manual.code")} hint={t("pay.manual.codeHelp")} value={code} maxLength={30} autoCapitalize="characters" autoComplete="off" onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""))} />
        </div>
      </details>

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-5 space-y-2">
        {(!expired || claimable) && <Button size="lg" className="w-full" loading={busy} onClick={() => setConfirming(true)}><CheckIcon width={18} height={18} />{t("pay.manual.claim")}</Button>}
        {expired && <Button size="lg" variant="secondary" className="w-full" onClick={onRestart}>{t("pay.manual.restart")}</Button>}
        {!expired && <Button variant="ghost" className="w-full" onClick={onChangeMethod}>{t("pay.waiting.change")}</Button>}
      </div>

      {confirming && (
        <Modal size="sm" onClose={() => setConfirming(false)}>
          <div className="pt-2 text-center">
            <h2 className="font-display text-xl font-extrabold">{t("pay.manual.claimTitle")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("pay.manual.claimBody")}</p>
            <p className="mt-3 rounded-xl bg-elevated px-3 py-2 text-sm font-semibold">{NAME[method]} · {spaced(store.number)}</p>
            <div className="mt-5 space-y-2">
              <Button size="lg" className="w-full" loading={busy} onClick={async () => { await onClaim(code); setConfirming(false); }}>{t("pay.manual.claimYes")}</Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => setConfirming(false)}>{t("pay.manual.claimNo")}</Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
