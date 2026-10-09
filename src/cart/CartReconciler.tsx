import { useCallback, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiError } from "@/lib/api";
import { consumePending, dropPending, listPending } from "@/lib/cartPending";
import { useCart } from "./CartContext";

const PAID = new Set(["PAID", "PROCESSING", "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]);
const DEAD = new Set(["CANCELLED", "CANCELLATION_REQUESTED", "REFUND_PENDING", "REFUNDED"]);

// Rede de segurança do carrinho: se o cliente pagou e fechou a página (ou o pagamento confirmou pelo webhook mais tarde),
// ao voltar à app os itens pagos saem do carrinho e os que não foram escolhidos ficam. Não renderiza nada.
export function CartReconciler() {
  const { token } = useAuth();
  const { removePaid } = useCart();

  const reconcile = useCallback(async () => {
    if (!token) return;
    for (const record of listPending()) {
      try {
        const order = await api.orders.get(record.orderId, token);
        if (PAID.has(order.status)) {
          const taken = consumePending(record.orderId);
          if (taken) removePaid(taken.lines);
        } else if (DEAD.has(order.status)) {
          dropPending(record.orderId); // encomenda cancelada: os itens ficam no carrinho
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) dropPending(record.orderId);
        // outros erros (rede): tenta de novo na próxima vez
      }
    }
  }, [token, removePaid]);

  useEffect(() => {
    void reconcile();
    const onVisible = () => { if (document.visibilityState === "visible") void reconcile(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reconcile]);

  return null;
}
