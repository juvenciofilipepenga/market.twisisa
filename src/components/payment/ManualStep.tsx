import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { formatCountdown } from "@/lib/payments";
import type { PaymentMethodId, PaymentView } from "@/lib/types";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { CameraIcon, CheckIcon, DocumentIcon } from "../icons";
import { NAME } from "./MethodStep";
import { spaced, StoreCard } from "./StoreCard";

// Pagamento manual em curso: contagem decrescente, os dados da loja (copiáveis), os 3 passos e o botão "Já paguei".
// Se o tempo acabar, o botão continua disponível (tolerância no servidor) para quem pagou no último minuto.
export function ManualStep({ payment, store, windowSeconds, busy, error, onClaim, onRestart, onChangeMethod }: {
  payment: PaymentView; store: { number: string; name: string | null }; windowSeconds: number; busy: boolean; error: string | null;
  onClaim: (code: string, proof?: File) => unknown; onRestart: () => void; onChangeMethod: () => unknown;
}) {
  const { t } = useLocale();
  const method: PaymentMethodId = payment.method === "EMOLA" ? "EMOLA" : "MPESA";
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  function pickProof(file: File | undefined) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setProofNote(t("pay.proof.tooBig")); return; }
    setProofNote(null);
    setProof(file);
  }
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

      <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold">{t("pay.proof.title")} <span className="font-normal text-ink-muted">{t("pay.proof.optional")}</span></p>
        <p className="mt-1 text-xs text-ink-muted">{t("pay.proof.hint")}</p>
        {proof ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-elevated px-3 py-2.5">
            {proof.type === "application/pdf" ? <DocumentIcon width={18} height={18} /> : <CameraIcon width={18} height={18} />}
            <span className="min-w-0 flex-1 truncate text-sm">{proof.name}</span>
            <button type="button" onClick={() => setProof(null)} className="press shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink">{t("pay.proof.remove")}</button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => photoInput.current?.click()} className="press flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:border-ink-faint"><CameraIcon width={18} height={18} />{t("pay.proof.photo")}</button>
            <button type="button" onClick={() => pdfInput.current?.click()} className="press flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:border-ink-faint"><DocumentIcon width={18} height={18} />{t("pay.proof.pdf")}</button>
          </div>
        )}
        {proofNote && <p role="alert" className="mt-2 text-xs text-danger">{proofNote}</p>}
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label={t("pay.proof.photo")} onChange={(e) => { pickProof(e.target.files?.[0]); e.target.value = ""; }} />
        <input ref={pdfInput} type="file" accept="application/pdf" className="sr-only" tabIndex={-1} aria-label={t("pay.proof.pdf")} onChange={(e) => { pickProof(e.target.files?.[0]); e.target.value = ""; }} />
      </div>

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
              <Button size="lg" className="w-full" loading={busy} onClick={async () => { await onClaim(code, proof ?? undefined); setConfirming(false); }}>{t("pay.manual.claimYes")}</Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => setConfirming(false)}>{t("pay.manual.claimNo")}</Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
