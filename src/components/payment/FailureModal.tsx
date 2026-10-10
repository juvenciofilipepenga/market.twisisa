import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import type { PaymentFailureKind } from "@/lib/types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

// Erro "bom": diz o que aconteceu em português simples, tranquiliza sobre o dinheiro e dá duas saídas claras.
export function FailureModal({ kind, note, onRetry, onClose, onDismiss }: { kind: PaymentFailureKind; note?: string | null; onRetry: () => void; onClose: () => void; onDismiss: () => void }) {
  const { t } = useLocale();
  const retryable = kind !== "AMOUNT_MISMATCH";
  return (
    <Modal
      size="sm"
      onClose={onDismiss}
      art={<div className="flex justify-center bg-elevated pt-3"><img src={img.mascotConfused} alt="" width={900} height={900} className="h-32 w-auto object-contain" /></div>}
    >
      <div role="alertdialog" aria-live="assertive" className="pt-4 text-center">
        <h2 className="font-display text-xl font-extrabold">{t(`pay.fail.${kind}.title`)}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t(`pay.fail.${kind}.body`)}</p>
        {note && <p className="mt-2 rounded-xl bg-elevated px-3 py-2 text-sm"><span className="text-ink-muted">{t("pay.fail.storeNote")}: </span>{note}</p>}
        <div className="mt-5 space-y-2">
          {retryable && <Button size="lg" className="w-full" onClick={onRetry}>{t("pay.fail.retry")}</Button>}
          <Button size="lg" variant="secondary" className="w-full" onClick={onClose}>{t("pay.fail.close")}</Button>
        </div>
        <p className="mt-3 text-xs text-ink-faint">{t("pay.fail.hint")}</p>
      </div>
    </Modal>
  );
}
