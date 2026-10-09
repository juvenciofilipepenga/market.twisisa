import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useCart } from "@/cart/CartContext";
import { consumePending } from "@/lib/cartPending";
import { useLocale } from "@/i18n/LocaleContext";
import { api, ApiError } from "@/lib/api";
import { saveBlob } from "@/lib/download";
import { img } from "@/lib/images";
import { cleanPhone, usePaymentPolling } from "@/lib/payments";
import type { Invoice, Order, PaymentFailureKind, PaymentMethodId, PaymentView } from "@/lib/types";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { MethodStep, phoneValid } from "@/components/payment/MethodStep";
import { SendingStep } from "@/components/payment/SendingStep";
import { WaitingStep } from "@/components/payment/WaitingStep";
import { SuccessStep } from "@/components/payment/SuccessStep";
import { FailureModal } from "@/components/payment/FailureModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Step = "loading" | "choose" | "sending" | "waiting" | "success" | "blocked" | "not-found";
const ACTIVE = new Set(["INITIATED", "AUTHENTICATING", "PENDING_CONFIRMATION"]);
const PAID_ORDER = new Set(["PAID", "PROCESSING", "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]);

// Fluxo: escolher método → pedido no telemóvel → ecrã de espera → (só depois de o servidor confirmar com o ZumboPay) celebração.
// Pagamentos pendentes retomam aqui: abrir /pagamento/:encomenda com um pagamento em curso volta direto ao ecrã de espera.
export default function PaymentPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const { t } = useLocale();
  useDocumentMeta({ title: `${t("pay.secure")} · Twisisa Market`, noindex: true });
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { removePaid } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [blocked, setBlocked] = useState<string>("pay.blocked.generic");
  const [available, setAvailable] = useState<PaymentMethodId[] | null>(null);
  const [sandbox, setSandbox] = useState(false);
  const [method, setMethod] = useState<PaymentMethodId>("MPESA");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [failure, setFailure] = useState<PaymentFailureKind | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const invoiceTries = useRef(0);

  const loadInvoice = useCallback((invoiceId: string | null) => {
    if (!token || !invoiceId) return;
    api.invoices.get(invoiceId, token).then(setInvoice).catch(() => undefined);
  }, [token]);

  // Aplica o que o servidor diz. Único sítio que decide o ecrã a mostrar a partir de um estado de pagamento.
  const applyView = useCallback((view: PaymentView, live: boolean) => {
    setPayment(view);
    if (view.state === "pending") { setStep("waiting"); return; }
    if (view.state === "success") {
      setStep("success");
      setCelebrate(live);
      loadInvoice(view.invoiceId);
      return;
    }
    setStep("choose");
    setFailure(view.failureKind ?? "UNKNOWN");
  }, [loadInvoice]);

  // Carga inicial: encomenda + métodos + (se existir) pagamento em curso para retomar.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [loaded, info, me] = await Promise.all([
          api.orders.get(orderId, token),
          api.payments.methods().catch(() => null),
          api.users.me(token).catch(() => null)
        ]);
        if (cancelled) return;
        setOrder(loaded);
        if (info) { setAvailable(info.methods); setSandbox(info.sandbox); if (info.methods.length && !info.methods.includes("MPESA")) setMethod(info.methods[0]!); }
        const mine = cleanPhone(me?.phone ?? "");
        if (mine) { setPhone(mine); if (/^8[67]/.test(mine)) setMethod((m) => (m === "MPESA" ? "EMOLA" : m)); }

        const payments = loaded.payments ?? [];
        if (PAID_ORDER.has(loaded.status)) {
          const paid = payments.find((p) => p.status === "SUCCESS" || p.status === "PAYMENT_CONFIRMED");
          if (paid) {
            const view = await api.payments.status(paid.id, token).catch(() => null);
            if (!cancelled && view) { applyView(view, false); return; }
          }
          setBlocked("pay.blocked.paid"); setStep("blocked"); return;
        }
        if (loaded.status === "PAYMENT_REVIEW") { setBlocked("pay.blocked.review"); setStep("blocked"); return; }
        if (loaded.status !== "PENDING_PAYMENT") { setBlocked("pay.blocked.closed"); setStep("blocked"); return; }

        const active = payments.find((p) => p.provider === "ZUMBOPAY" && ACTIVE.has(p.status));
        if (active) {
          const view = await api.payments.status(active.id, token).catch(() => null);
          if (!cancelled && view) { if (view.method === "MPESA" || view.method === "EMOLA") { setMethod(view.method); } applyView(view, true); return; }
        }
        if (payments.some((p) => p.provider === "MANUAL" && ["PROOF_SUBMITTED", "UNDER_REVIEW"].includes(p.status))) { setBlocked("pay.blocked.review"); setStep("blocked"); return; }
        setStep("choose");
      } catch {
        if (!cancelled) setStep("not-found");
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, token, applyView]);

  const { offline } = usePaymentPolling({ paymentId: payment?.id ?? null, token, enabled: step === "waiting", onView: (view) => applyView(view, true) });

  // A fatura é emitida logo a seguir à confirmação: se ainda não existir, tenta mais umas vezes.
  useEffect(() => {
    if (step !== "success" || invoice || !payment || invoiceTries.current >= 4 || !token) return;
    const id = window.setTimeout(async () => {
      invoiceTries.current += 1;
      const view = await api.payments.status(payment.id, token).catch(() => null);
      if (view?.invoiceId) loadInvoice(view.invoiceId); else setPayment((p) => (p ? { ...p } : p));
    }, 2000);
    return () => window.clearTimeout(id);
  }, [step, invoice, payment, token, loadInvoice]);

  // Pagamento confirmado pelo servidor: SÓ agora os itens pagos saem do carrinho (os não escolhidos ficam).
  // consumePending apaga o registo, por isso nunca se desconta duas vezes.
  useEffect(() => {
    if (step !== "success") return;
    const record = consumePending(orderId);
    if (record) removePaid(record.lines);
  }, [step, orderId, removePaid]);

  async function pay() {
    if (!token || !order) return;
    setPhoneTouched(true);
    if (!phoneValid(method, phone)) return;
    setPaying(true);
    setStep("sending"); // feedback imediato: "A enviar o pedido para o seu telemóvel…" em vez de só um spinner no botão
    try {
      const payload = method === "CARD"
        ? ({ provider: "ZUMBOPAY", method: "CARD" } as const)
        : ({ provider: "ZUMBOPAY", method, paymentNumber: phone } as const);
      const view = await api.payments.initiate(order.id, payload, token);
      if (method === "CARD" && view.checkoutUrl) { window.location.assign(view.checkoutUrl); return; }
      applyView(view, true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "PAYMENT_ALREADY_ACTIVE" && typeof err.data.paymentId === "string") {
        const view = await api.payments.status(err.data.paymentId, token).catch(() => null);
        if (view) { applyView(view, true); return; }
      }
      setStep("choose");
      setFailure("UNAVAILABLE");
    } finally {
      setPaying(false);
    }
  }

  async function changeMethod() {
    if (!token || !payment) return;
    try {
      const view = await api.payments.cancel(payment.id, token);
      // Se entretanto foi pago, ganha o pago (nunca se cancela dinheiro já recebido).
      if (view.state === "success") { applyView(view, true); return; }
    } catch { /* o servidor volta a libertar a encomenda quando o pedido expirar */ }
    setPayment(null);
    setStep("choose");
  }

  async function downloadInvoice() {
    if (!token || !invoice) return;
    try {
      saveBlob(await api.invoices.downloadPdf(invoice.id, token), `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast.show(t("toast.invoiceError"), { tone: "error", key: "invoice" });
    }
  }

  const goOrder = () => navigate(`/encomenda/${orderId}`);
  const itemCount = order?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <PaymentShell onBack={goOrder}>
      {step === "loading" && <div className="space-y-4 pt-2"><Skeleton className="mx-auto h-16 w-2/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-14 w-full" /></div>}
      {step === "not-found" && <EmptyState image={img.mascotConfused} title={t("order.notFound")} action={<Button variant="secondary" onClick={() => navigate("/pedidos")}>{t("orders.title")}</Button>} />}
      {step === "blocked" && <EmptyState image={img.mascotConfused} title={t(blocked)} action={<Button variant="secondary" onClick={goOrder}>{t("pay.viewOrder")}</Button>} />}

      {step === "choose" && order && (
        <MethodStep
          orderNumber={order.orderNumber} total={order.totalMzn} itemCount={itemCount}
          available={available} sandbox={sandbox}
          method={method} onMethod={(m) => { setMethod(m); setPhoneTouched(false); }}
          phone={phone} onPhone={setPhone} phoneTouched={phoneTouched}
          paying={paying} onPay={pay}
        />
      )}
      {step === "sending" && order && <SendingStep method={method} phone={phone} total={order.totalMzn} />}
      {step === "waiting" && payment && <WaitingStep payment={payment} offline={offline} onChangeMethod={changeMethod} />}
      {step === "success" && payment && <SuccessStep payment={payment} invoice={invoice} celebrate={celebrate} onTrack={goOrder} onInvoice={downloadInvoice} />}

      {failure && (
        <FailureModal
          kind={failure}
          onRetry={() => { setFailure(null); setStep("choose"); setPayment(null); }}
          onDismiss={() => { setFailure(null); setStep("choose"); setPayment(null); }}
          onClose={() => { setFailure(null); toast.show(t("pay.fail.closed"), { key: "pay-closed" }); navigate("/pedidos"); }}
        />
      )}
    </PaymentShell>
  );
}
