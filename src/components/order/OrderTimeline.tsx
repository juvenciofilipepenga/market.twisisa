import { useLocale } from "@/i18n/LocaleContext";
import type { OrderStatus } from "@/lib/types";
import { CheckIcon } from "../icons";

const STEPS = ["pay", "paid", "prep", "ship", "done"] as const;

// Estados que fazem parte do percurso normal → passo actual. Cancelamentos/reembolsos não têm percurso (devolve null).
export function stepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "PENDING_PAYMENT": case "PAYMENT_REVIEW": return 0;
    case "PAID": return 1;
    case "PROCESSING": case "READY_FOR_SHIPMENT": return 2;
    case "SHIPPED": case "OUT_FOR_DELIVERY": return 3;
    case "DELIVERED": return 4;
    default: return null;
  }
}

// Percurso da encomenda: a linha vermelha avança até ao passo actual (transição de largura, uma vez ao abrir)
// e o passo em curso pulsa. Mostra ao cliente, de relance, onde está a compra.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const { t } = useLocale();
  const current = stepIndex(status);
  if (current === null) return null;
  const last = STEPS.length - 1;

  return (
    <ol className="relative flex justify-between" aria-label={t("order.history")}>
      <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-[14px] h-0.5 bg-border" />
      <span aria-hidden="true" className="absolute left-[10%] top-[14px] h-0.5 bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${(current / last) * 80}%` }} />
      {STEPS.map((step, i) => {
        const done = i < current || (i === current && current === last);
        const active = i === current && !done;
        return (
          <li key={step} className="relative z-10 flex w-1/5 flex-col items-center gap-2 text-center" aria-current={active ? "step" : undefined}>
            <span className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${done ? "border-primary bg-primary text-white" : active ? "border-primary bg-bg text-primary-text" : "border-border bg-bg text-ink-faint"}`}>
              {active && <span aria-hidden="true" className="absolute inset-[-5px] animate-pulse rounded-full bg-primary/25 motion-reduce:animate-none" />}
              <span className="relative">{done ? <CheckIcon width={14} height={14} /> : i + 1}</span>
            </span>
            <span className={`text-[11px] font-semibold leading-tight ${done || active ? "text-ink" : "text-ink-faint"}`}>{t(`order.step.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
