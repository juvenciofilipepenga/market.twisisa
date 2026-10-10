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
import type { Invoice, Order, PaymentFailureKind, PaymentMethodId, PaymentMethodsInfo, PaymentView } from "@/lib/types";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { manualMethods, MethodStep, nameValid, phoneValid } from "@/components/payment/MethodStep";
import { ManualCardStep } from "@/components/payment/ManualCardStep";
import { ManualStep } from "@/components/payment/ManualStep";
import { ReviewStep } from "@/components/payment/ReviewStep";
import { SendingStep } from "@/components/payment/SendingStep";
import { WaitingStep } from "@/components/payment/WaitingStep";
import { SuccessStep } from "@/components/payment/SuccessStep";
import { FailureModal } from "@/components/payment/FailureModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Step = "loading" | "choose" | "sending" | "waiting" | "manualCard" | "manual" | "review" | "success" | "blocked" | "not-found";
const ACTIVE = new Set(["INITIATED", "AUTHENTICATING", "PENDING_CONFIRMATION", "PAYMENT_PENDING", "PROOF_SUBMITTED", "UNDER_REVIEW"]);
const PAID_ORDER = new Set(["PAID", "PROCESSING", "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]);
const LATE_CLAIM_LOOKBACK_MS = 35 * 60_000; // um pouco mais que a tolerância do servidor (30 min)

// Fluxo automático: escolher método → pedido no telemóvel → espera → (só depois de o servidor confirmar com o ZumboPay) celebração.
// Fluxo manual (plano B): método + número e nome de quem paga → cartão da loja → "Enviar pedido" (5 min) → pagar → "Já paguei" → loja confirma.
// Pagamentos pendentes retomam aqui: abrir /pagamento/:encomenda com um pagamento em curso volta ao ecrã certo.
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
  const [info, setInfo] = useState<PaymentMethodsInfo | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>("MPESA");
  const [userManual, setUserManual] = useState(false);
  const [phone, setPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const [touched, setTouched] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [failure, setFailure] = useState<PaymentFailureKind | null>(null);
  const [failureNote, setFailureNote] = useState<string | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const invoiceTries = useRef(0);

  // Automático em baixo (desligado, a falhar ou sem carteira) → manual por defeito. Senão, o cliente pode escolher o manual.
  const manualOptions = manualMethods(info?.manual);
  const onlineDown = info ? info.onlineStatus !== "ok" || info.methods.length === 0 : false;
  const manualMode = manualOptions.length > 0 && (onlineDown || userManual);
  const storeFor = (m: PaymentMethodId | string | null) => (m === "EMOLA" ? info?.manual.emola : info?.manual.mpesa) ?? null;

  // O método escolhido tem de existir no modo atual (ex.: cartão não existe no manual; e-Mola sem destino também não).
  useEffect(() => {
    if (!info) return;
    if (manualMode && !manualOptions.includes(method as "MPESA" | "EMOLA")) setMethod(manualOptions[0]!);
    if (!manualMode && info.methods.length > 0 && !info.methods.includes(method)) setMethod(info.methods[0]!);
  }, [info, manualMode, method]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvoice = useCallback((invoiceId: string | null) => {
    if (!token || !invoiceId) return;
    api.invoices.get(invoiceId, token).then(setInvoice).catch(() => undefined);
  }, [token]);

  // Aplica o que o servidor diz. Único sítio que decide o ecrã a mostrar a partir de um estado de pagamento.
  const applyView = useCallback((view: PaymentView, live: boolean) => {
    setPayment(view);
    if (view.state === "pending") {
      // Manual: ou ainda falta pagar e carregar em "Já paguei", ou já carregou e a loja está a conferir.
      if (view.provider === "MANUAL") setStep(view.status === "PROOF_SUBMITTED" || view.status === "UNDER_REVIEW" ? "review" : "manual");
      else setStep("waiting");
      return;
    }
    if (view.state === "success") {
      setStep("success");
      setCelebrate(live);
      loadInvoice(view.invoiceId);
      return;
    }
    // Manual expirado, mas ainda dentro da tolerância: quem já pagou pode carregar em "Já paguei".
    if (view.provider === "MANUAL" && view.status === "TIMEOUT" && view.claimUntil && Date.now() < new Date(view.claimUntil).getTime()) {
      setStep("manual");
      return;
    }
    setStep("choose");
    setFailureNote(view.note);
    setFailure(view.failureKind ?? "UNKNOWN");
  }, [loadInvoice]);

  // Carga inicial: encomenda + métodos + (se existir) pagamento em curso para retomar.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [loaded, fetched, me] = await Promise.all([
          api.orders.get(orderId, token),
          api.payments.methods().catch(() => null),
          api.users.me(token).catch(() => null)
        ]);
        if (cancelled) return;
        setOrder(loaded);
        if (fetched) setInfo(fetched);
        const mine = cleanPhone(me?.phone ?? "");
        if (mine) { setPhone(mine); if (/^8[67]/.test(mine)) setMethod("EMOLA"); }
        if (me?.name) setPayerName(me.name);

        const payments = loaded.payments ?? [];
        if (PAID_ORDER.has(loaded.status)) {
          const paid = payments.find((p) => p.status === "SUCCESS" || p.status === "PAYMENT_CONFIRMED");
          if (paid) {
            const view = await api.payments.status(paid.id, token).catch(() => null);
            if (!cancelled && view) { applyView(view, false); return; }
          }
          setBlocked("pay.blocked.paid"); setStep("blocked"); return;
        }
        if (loaded.status !== "PENDING_PAYMENT" && loaded.status !== "PAYMENT_REVIEW") { setBlocked("pay.blocked.closed"); setStep("blocked"); return; }

        // Retoma o pagamento em curso: online à espera do PIN, ou manual (a pagar / a aguardar a loja / expirado mas ainda reclamável).
        const lateManual = payments.find((p) => p.provider === "MANUAL" && p.status === "TIMEOUT" && p.expiresAt && Date.now() < new Date(p.expiresAt).getTime() + LATE_CLAIM_LOOKBACK_MS);
        const active = payments.find((p) => ACTIVE.has(p.status)) ?? lateManual;
        if (active) {
          const view = await api.payments.status(active.id, token).catch(() => null);
          if (!cancelled && view) {
            if (view.method === "MPESA" || view.method === "EMOLA") setMethod(view.method);
            if (view.provider === "MANUAL") { setUserManual(true); if (view.paymentNumber) setPhone(view.paymentNumber); if (view.payerName) setPayerName(view.payerName); }
            applyView(view, true);
            return;
          }
        }
        if (loaded.status === "PAYMENT_REVIEW") { setBlocked("pay.blocked.review"); setStep("blocked"); return; }
        setStep("choose");
      } catch {
        if (!cancelled) setStep("not-found");
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, token, applyView]);

  const { offline } = usePaymentPolling({ paymentId: payment?.id ?? null, token, enabled: step === "waiting" || step === "review", onView: (view) => applyView(view, true) });

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

  // "Continuar"/"Pagar" no ecrã de escolha.
  async function pay() {
    if (!token || !order) return;
    setTouched(true);
    if (!phoneValid(method, phone) || (manualMode && !nameValid(payerName))) return;
    // Manual: primeiro o cliente vê PARA QUEM vai pagar; o pedido só é criado em "Enviar pedido".
    if (manualMode) { setManualError(null); setStep("manualCard"); return; }
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
      // O ZumboPay pode ter acabado de falhar: atualiza o que está disponível; se o online caiu, o ecrã passa ao manual.
      const fresh = await api.payments.methods().catch(() => null);
      if (fresh) setInfo(fresh);
      setStep("choose");
      setFailureNote(null);
      setFailure("UNAVAILABLE");
    } finally {
      setPaying(false);
    }
  }

  // "Enviar pedido": cria o pagamento manual e arranca a contagem (por defeito 5 min).
  async function sendManual() {
    if (!token || !order || (method !== "MPESA" && method !== "EMOLA")) return;
    setManualBusy(true);
    setManualError(null);
    try {
      const view = await api.payments.initiate(order.id, { provider: "MANUAL", method, paymentNumber: phone, payerName: payerName.trim() }, token);
      applyView(view, true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "PAYMENT_ALREADY_ACTIVE" && typeof err.data.paymentId === "string") {
        const view = await api.payments.status(err.data.paymentId, token).catch(() => null);
        if (view) { applyView(view, true); return; }
      }
      setManualError(t(err instanceof ApiError && err.code === "PAYER_NUMBER_BUSY" ? "pay.manual.busy" : err instanceof ApiError && err.code === "MANUAL_PAYMENT_UNAVAILABLE" ? "pay.manual.unavailable" : "pay.manual.sendError"));
    } finally {
      setManualBusy(false);
    }
  }

  // "Já paguei": a partir daqui o pedido aparece ao admin, que confere no histórico da conta da loja.
  async function claim(code: string) {
    if (!token || !payment) return;
    setManualBusy(true);
    setManualError(null);
    try {
      const view = await api.payments.claim(payment.id, { transactionCode: code || undefined }, token);
      applyView(view, true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "PAYMENT_NOT_CLAIMABLE") { setManualError(t("pay.manual.notClaimable")); }
      else setManualError(t(err instanceof ApiError && err.code === "TRANSACTION_CODE_ALREADY_USED" ? "pay.manual.codeUsed" : "pay.manual.sendError"));
    } finally {
      setManualBusy(false);
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
  const store = storeFor(payment?.method ?? method);
  const restart = () => { setPayment(null); setManualError(null); setStep("choose"); };

  return (
    <PaymentShell onBack={goOrder}>
      {step === "loading" && <div className="space-y-4 pt-2"><Skeleton className="mx-auto h-16 w-2/3" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-14 w-full" /></div>}
      {step === "not-found" && <EmptyState image={img.mascotConfused} title={t("order.notFound")} action={<Button variant="secondary" onClick={() => navigate("/pedidos")}>{t("orders.title")}</Button>} />}
      {step === "blocked" && <EmptyState image={img.mascotConfused} title={t(blocked)} action={<Button variant="secondary" onClick={goOrder}>{t("pay.viewOrder")}</Button>} />}

      {step === "choose" && order && (
        <MethodStep
          orderNumber={order.orderNumber} total={order.totalMzn} itemCount={itemCount}
          available={info ? info.methods : null} onlineStatus={info?.onlineStatus ?? "ok"} manual={info?.manual ?? null}
          mode={manualMode ? "manual" : "online"} onMode={(m) => { setUserManual(m === "manual"); setTouched(false); }}
          sandbox={info?.sandbox ?? false}
          method={method} onMethod={(m) => { setMethod(m); setTouched(false); }}
          phone={phone} onPhone={setPhone} payerName={payerName} onPayerName={setPayerName} touched={touched}
          paying={paying} onPay={pay}
        />
      )}
      {step === "sending" && order && <SendingStep method={method} phone={phone} total={order.totalMzn} />}
      {step === "manualCard" && order && store && (
        <ManualCardStep method={method} amount={order.totalMzn} store={store} payerName={payerName.trim()} payerNumber={phone}
          windowSeconds={info?.manualWindowSeconds ?? 300} busy={manualBusy} error={manualError} onSend={sendManual} onBack={() => setStep("choose")} />
      )}
      {step === "manual" && payment && store && (
        <ManualStep payment={payment} store={store} windowSeconds={info?.manualWindowSeconds ?? 300} busy={manualBusy} error={manualError}
          onClaim={claim} onRestart={restart} onChangeMethod={changeMethod} />
      )}
      {step === "review" && payment && <ReviewStep payment={payment} offline={offline} onOrder={goOrder} />}
      {step === "waiting" && payment && <WaitingStep payment={payment} offline={offline} onChangeMethod={changeMethod} />}
      {step === "success" && payment && <SuccessStep payment={payment} invoice={invoice} celebrate={celebrate} onTrack={goOrder} onInvoice={downloadInvoice} />}

      {failure && (
        <FailureModal
          kind={failure}
          note={failureNote}
          onRetry={() => { setFailure(null); setFailureNote(null); setStep("choose"); setPayment(null); }}
          onDismiss={() => { setFailure(null); setFailureNote(null); setStep("choose"); setPayment(null); }}
          onClose={() => { setFailure(null); toast.show(t("pay.fail.closed"), { key: "pay-closed" }); navigate("/pedidos"); }}
        />
      )}
    </PaymentShell>
  );
}
