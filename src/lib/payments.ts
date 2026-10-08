import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { PaymentMethodId, PaymentView } from "./types";

// Redes móveis moçambicanas pelo prefixo (o backend volta a validar): M-Pesa 84/85, e-Mola 86/87.
export const PHONE_RULES: Record<"MPESA" | "EMOLA", RegExp> = { MPESA: /^8[45]\d{7}$/, EMOLA: /^8[67]\d{7}$/ };

/** Só dígitos, sem o indicativo 258, no máximo 9. */
export function cleanPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("258") && digits.length > 9) digits = digits.slice(3);
  return digits.slice(0, 9);
}

/** 841234567 → 84 ••• 4567 (o ecrã de espera mostra para onde foi o pedido sem expor o número todo). */
export function maskPhone(phone: string | null): string {
  if (!phone || phone.length < 9) return "";
  return `${phone.slice(0, 2)} ••• ${phone.slice(5)}`;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const METHOD_ORDER: PaymentMethodId[] = ["MPESA", "EMOLA", "CARD"];

interface PollOptions {
  paymentId: string | null;
  token: string | null;
  enabled: boolean;
  onView: (view: PaymentView) => void;
}

// Pergunta o estado ao servidor de 3 em 3 s (o servidor confirma com o ZumboPay) até o pagamento sair de "pending".
// Uma falha de rede NÃO é falha de pagamento: só mostra "sem ligação" e continua a tentar, com intervalo crescente.
// Ao voltar ao separador (o cliente foi à app M-Pesa e regressou), pergunta logo.
export function usePaymentPolling({ paymentId, token, enabled, onView }: PollOptions): { offline: boolean } {
  const [offline, setOffline] = useState(false);
  const callback = useRef(onView);
  callback.current = onView;

  useEffect(() => {
    if (!enabled || !paymentId || !token) return;
    let stopped = false;
    let inflight = false;
    let fails = 0;
    let timer: number | undefined;

    const tick = async () => {
      if (stopped || inflight) return;
      inflight = true;
      let finished = false;
      try {
        const view = await api.payments.status(paymentId, token);
        if (stopped) return;
        fails = 0;
        setOffline(false);
        callback.current(view);
        finished = view.state !== "pending";
      } catch {
        fails += 1;
        if (fails >= 2) setOffline(true);
      } finally {
        inflight = false;
      }
      if (!stopped && !finished) timer = window.setTimeout(tick, fails ? Math.min(3000 * (fails + 1), 10_000) : 3000);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    timer = window.setTimeout(tick, 1500);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [paymentId, token, enabled]);

  return { offline };
}
