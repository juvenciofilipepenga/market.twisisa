import type { AppNotification } from "./types";

export interface NotificationAction { to: string; labelKey: string }

// Uma só ação por notificação, a mais útil: ir ao sítio de que ela fala. Sem destino, sem botão.
export function notificationAction(n: AppNotification, isAdmin: boolean): NotificationAction | null {
  const data = n.data ?? {};
  const orderId = typeof data.orderId === "string" ? data.orderId : null;
  if (isAdmin) {
    // "Pagamento a confirmar" leva direto à lista de trabalho do admin.
    if (n.type === "PAYMENT" && n.title === "Pagamento a confirmar") return { to: "/admin/pagamentos", labelKey: "notif.action.confirmPayment" };
    if (orderId) return { to: "/admin/pedidos", labelKey: "notif.action.openOrders" };
    return null;
  }
  if (orderId) return { to: `/encomenda/${orderId}`, labelKey: "notif.action.order" };
  return null;
}
