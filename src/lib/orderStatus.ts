import type { OrderStatus } from "./types";
import type { Locale } from "../i18n/dictionaries";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT", "PAYMENT_REVIEW", "PAID", "PROCESSING", "READY_FOR_SHIPMENT",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLATION_REQUESTED", "CANCELLED",
  "REFUND_PENDING", "REFUNDED"
];

export const orderStatusLabel: Record<Locale, Record<OrderStatus, string>> = {
  pt: {
    PENDING_PAYMENT: "Aguarda pagamento", PAYMENT_REVIEW: "Pagamento em revisão", PAID: "Paga",
    PROCESSING: "Em processamento", READY_FOR_SHIPMENT: "Pronta para envio", SHIPPED: "Enviada",
    OUT_FOR_DELIVERY: "Em entrega", DELIVERED: "Entregue", CANCELLATION_REQUESTED: "Cancelamento pedido",
    CANCELLED: "Cancelada", REFUND_PENDING: "Reembolso pendente", REFUNDED: "Reembolsada"
  },
  en: {
    PENDING_PAYMENT: "Awaiting payment", PAYMENT_REVIEW: "Payment under review", PAID: "Paid",
    PROCESSING: "Processing", READY_FOR_SHIPMENT: "Ready for shipment", SHIPPED: "Shipped",
    OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLATION_REQUESTED: "Cancellation requested",
    CANCELLED: "Cancelled", REFUND_PENDING: "Refund pending", REFUNDED: "Refunded"
  }
};

export const orderStatusTone: Record<OrderStatus, "warning" | "info" | "success" | "danger"> = {
  PENDING_PAYMENT: "warning", PAYMENT_REVIEW: "warning", PAID: "info", PROCESSING: "info",
  READY_FOR_SHIPMENT: "info", SHIPPED: "info", OUT_FOR_DELIVERY: "info", DELIVERED: "success",
  CANCELLATION_REQUESTED: "warning", CANCELLED: "danger", REFUND_PENDING: "warning", REFUNDED: "danger"
};

// Espelha EXACTAMENTE `adminTransitions` de src/routes/orders.ts no backend (chave = estado
// destino, valor = estados de origem permitidos). Tem de ser mantido manualmente em sincronia
// com esse ficheiro — o backend é sempre a fonte da verdade e valida de novo do seu lado;
// isto serve só para não mostrar ao admin opções que o servidor vai recusar de qualquer forma.
const targetFromSources: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PROCESSING: ["PAID"],
  READY_FOR_SHIPMENT: ["PROCESSING"],
  SHIPPED: ["READY_FOR_SHIPMENT"],
  OUT_FOR_DELIVERY: ["SHIPPED"],
  DELIVERED: ["OUT_FOR_DELIVERY", "SHIPPED"],
  CANCELLATION_REQUESTED: ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PAID", "PROCESSING"],
  REFUND_PENDING: ["CANCELLED", "CANCELLATION_REQUESTED"],
  REFUNDED: ["REFUND_PENDING"]
};

export function nextStatusOptions(current: OrderStatus): OrderStatus[] {
  return (Object.keys(targetFromSources) as OrderStatus[]).filter((target) =>
    (targetFromSources[target] ?? []).includes(current)
  );
}
