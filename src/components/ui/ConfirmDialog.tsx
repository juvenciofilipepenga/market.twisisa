import { useState, type ReactNode } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { adminError } from "@/lib/errors";
import { Button } from "./Button";
import { Modal } from "./Modal";

// Confirmação antes de acções difíceis de desfazer (suspender/bloquear, aprovar/rejeitar pagamento, cancelar encomenda).
// `onConfirm` pode ser async: o botão mostra spinner e, se lançar um erro, a mensagem aparece AQUI dentro, em português
// claro; se terminar bem, quem chama fecha o diálogo (põe o estado a null).
export function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onClose, children }: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(adminError(err, t));
    }
  }

  return (
    <Modal title={title} onClose={onClose} size="sm">
      <p className="text-sm text-ink-muted">{message}</p>
      {children && <div className="mt-3">{children}</div>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={run}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
