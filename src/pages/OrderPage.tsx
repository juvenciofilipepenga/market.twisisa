import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiError, type InitiatePaymentPayload } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import { img } from "@/lib/images";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Field } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Confetti } from "@/components/fx/Confetti";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { OrderBanner } from "@/components/order/OrderBanner";
import { ChevronLeftIcon, ClipboardIcon } from "@/components/icons";

type Method = "MPESA" | "EMOLA" | "CARD" | "GATEWAY";

// Mesma lista de estados canceláveis que o backend usa em src/routes/orders.ts (const
// cancellable) — mantido em sincronia à mão; o servidor volta a validar sempre.
const CANCELLABLE = new Set(["PENDING_PAYMENT", "PAYMENT_REVIEW", "PAID"]);

export default function OrderPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { token } = useAuth();
  const location = useLocation();
  const toast = useToast();
  // Vem do checkout: celebra uma vez e limpa o estado do histórico (um refresh não repete o confetti).
  const [celebrate] = useState(() => Boolean((location.state as { justCreated?: boolean } | null)?.justCreated));
  useEffect(() => { if (celebrate) navigate(location.pathname, { replace: true, state: null }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [order, setOrder] = useState<Order | null | "not-found">(null);
  const [method, setMethod] = useState<Method>("MPESA");
  const [phone, setPhone] = useState("");
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);

  const proofPreview = useMemo(() => (proofFile ? URL.createObjectURL(proofFile) : null), [proofFile]);
  useEffect(() => () => { if (proofPreview) URL.revokeObjectURL(proofPreview); }, [proofPreview]);

  function load() {
    if (!token) return;
    api.orders.get(id, token).then(setOrder).catch((err) => {
      setOrder(err instanceof ApiError && err.status === 404 ? "not-found" : "not-found");
    });
  }
  useEffect(load, [id, token]);

  async function initiatePayment() {
    if (!token || !order || order === "not-found") return;
    setInitiating(true);
    setInitiateError(null);
    try {
      let payload: InitiatePaymentPayload;
      if (method === "GATEWAY") payload = { provider: "ZUMBOPAY", method: "CARD" };
      else if (method === "CARD") payload = { provider: "MANUAL", method: "CARD" };
      else payload = { provider: "MANUAL", method, paymentNumber: phone.trim() };
      const result = await api.payments.initiate(order.id, payload, token);
      if (result.checkoutUrl) setCheckoutUrl(result.checkoutUrl);
      load();
    } catch (err) {
      setInitiateError(err instanceof ApiError ? err.code : t("common.error"));
    } finally {
      setInitiating(false);
    }
  }

  async function submitProof(paymentId: string) {
    if (!token || !proofFile) return;
    setSubmittingProof(true);
    try {
      const uploaded = await api.media.upload(proofFile, token);
      await api.payments.submitProof(paymentId, uploaded.url, token);
      setProofFile(null);
      load();
    } catch {
      setInitiateError(t("common.error"));
    } finally {
      setSubmittingProof(false);
    }
  }

  async function cancelOrder() {
    if (!token || !order || order === "not-found" || cancelReason.trim().length < 3) return;
    setCancelling(true);
    try {
      await api.orders.cancel(order.id, cancelReason.trim(), token);
      setShowCancelForm(false);
      load();
    } catch {
      setInitiateError(t("common.error"));
    } finally {
      setCancelling(false);
    }
  }

  async function downloadInvoice() {
    if (!token || !order || order === "not-found" || !order.invoice) return;
    try {
      const blob = await api.invoices.downloadPdf(order.invoice.id, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.show(t("toast.invoiceError"), { tone: "error" });
    }
  }

  const activePayment = order && order !== "not-found"
    ? order.payments?.find((p) => !["FAILED", "CANCELLED", "REFUNDED", "PAYMENT_REJECTED", "REFUNDED_LEGACY"].includes(p.status))
    : undefined;

  const ready = order && order !== "not-found" ? order : null;
  const needsPhone = method === "MPESA" || method === "EMOLA";

  return (
    <main className="pb-10">
      <Header />
      {celebrate && <Confetti />}
      <div className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => navigate("/")} className="press mb-3 -ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted hover:text-ink">
          <ChevronLeftIcon width={16} height={16} />{t("common.backHome")}
        </button>

        {order === null && <div className="space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-40 w-full" /></div>}
        {order === "not-found" && <EmptyState image={img.mascotConfused} title={t("order.notFound")} action={<Button variant="secondary" onClick={() => navigate("/")}>{t("common.backHome")}</Button>} />}

        {ready && (
          <div className="space-y-4">
            {celebrate ? (
              <OrderBanner image={img.mascotCelebrate} title={t("order.created")} body={t("order.createdBody")} />
            ) : ready.status === "DELIVERED" ? (
              <OrderBanner image={img.mascotCelebrate} title={t("order.delivered")} body={t("order.deliveredBody")} />
            ) : ready.status === "SHIPPED" || ready.status === "OUT_FOR_DELIVERY" ? (
              <OrderBanner image={img.mascotDelivery} title={t("order.onTheWay")} body={t("order.onTheWayBody")} />
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold">{ready.orderNumber}</h1>
                <p className="text-xs text-ink-faint">{new Date(ready.createdAt).toLocaleString()}</p>
              </div>
              <OrderStatusBadge status={ready.status} />
            </div>

            <div className="rounded-2xl border border-border bg-surface px-3 py-5 sm:px-5">
              <OrderTimeline status={ready.status} />
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-muted">{t("order.items")}</h2>
              <div className="space-y-1.5">
                {(ready.items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0">{item.quantity}× {item.productName}</span>
                    <span className="shrink-0 text-ink-muted tabular-nums">{formatMzn(item.subtotalMzn)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-ink-muted"><span>{t("order.subtotal")}</span><span className="tabular-nums">{formatMzn(ready.subtotalMzn)}</span></div>
                <div className="flex justify-between text-ink-muted"><span>{t("order.shipping")}</span><span className="tabular-nums">{formatMzn(ready.shippingMzn)}</span></div>
                {Number(ready.discountMzn) > 0 && <div className="flex justify-between text-ink-muted"><span>{t("order.discount")}</span><span className="tabular-nums">-{formatMzn(ready.discountMzn)}</span></div>}
                <div className="flex items-baseline justify-between pt-1"><span className="font-semibold">{t("order.total")}</span><span className="font-display text-xl font-extrabold tabular-nums">{formatMzn(ready.totalMzn)}</span></div>
              </div>
            </div>

            {ready.status === "PENDING_PAYMENT" && !activePayment && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold">{t("payment.chooseMethod")}</h2>
                  <img src={img.phone} alt="" width={700} height={1050} loading="lazy" className="h-12 w-auto shrink-0" />
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("payment.chooseMethod")}>
                  {(["MPESA", "EMOLA", "CARD", "GATEWAY"] as Method[]).map((m) => (
                    <button key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                      className={`press flex min-h-[48px] items-center justify-center rounded-xl border px-3 text-sm font-semibold ${method === m ? "border-primary bg-primary-soft text-ink" : "border-border text-ink-muted hover:border-ink-faint"}`}>
                      {t(`payment.${m === "GATEWAY" ? "gateway" : m.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
                {needsPhone && (
                  <Field label={t("payment.phoneNumber")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mb-3" />
                )}
                {initiateError && <p role="alert" className="mb-3 text-sm text-danger">{initiateError}</p>}
                <Button size="lg" className="w-full" loading={initiating} disabled={needsPhone && phone.trim().length < 9} onClick={initiatePayment}>
                  {t("payment.initiate")}
                </Button>
                {checkoutUrl && (
                  <a href={checkoutUrl} target="_blank" rel="noreferrer" className="mt-3 block text-center text-sm font-semibold text-primary-text underline underline-offset-4">
                    {t("payment.gateway")} →
                  </a>
                )}
              </div>
            )}

            {activePayment && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <h2 className="mb-2 text-base font-bold">{t("payment.title")}</h2>
                <p className="text-xs text-ink-faint">{t("payment.reference")}: <span className="font-mono text-ink-muted">{activePayment.reference}</span></p>
                <p className="mt-1 text-sm">{t("payment.status")}: <span className="font-semibold">{activePayment.status}</span></p>
                {activePayment.status === "PROOF_SUBMITTED" || activePayment.status === "UNDER_REVIEW" ? (
                  <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">{t("payment.proofSubmitted")}</p>
                ) : activePayment.provider === "MANUAL" && !activePayment.proofUrl ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-ink-muted">{t("payment.uploadProof")}</p>
                    <label className="press flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-elevated p-3 hover:border-ink-faint">
                      {proofPreview ? <img src={proofPreview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-faint"><ClipboardIcon width={20} height={20} /></span>}
                      <span className="min-w-0 truncate text-sm text-ink-muted">{proofFile ? proofFile.name : t("payment.chooseFile")}</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <Button size="lg" variant="secondary" className="w-full" loading={submittingProof} disabled={!proofFile} onClick={() => submitProof(activePayment.id)}>
                      {t("payment.submitProof")}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {ready.invoice && (
              <Button variant="secondary" size="lg" onClick={downloadInvoice} className="w-full">
                {t("order.downloadInvoice")}
              </Button>
            )}

            {CANCELLABLE.has(ready.status) && (
              <div className="rounded-2xl border border-danger/30 p-4">
                {!showCancelForm ? (
                  <Button variant="danger" className="w-full" onClick={() => setShowCancelForm(true)}>{t("order.cancel")}</Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-muted">{t("order.cancelConfirm")}</p>
                    <Field label={t("order.cancelReason")} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => setShowCancelForm(false)}>{t("common.cancel")}</Button>
                      <Button variant="danger" className="flex-1" loading={cancelling} disabled={cancelReason.trim().length < 3} onClick={cancelOrder}>{t("order.cancel")}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {ready.statusHistory && ready.statusHistory.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-ink-muted">{t("order.history")}</h2>
                <ol className="space-y-3 border-l border-border pl-4">
                  {ready.statusHistory.map((h) => (
                    <li key={h.id} className="relative text-sm">
                      <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="font-medium">{h.to}{h.reason ? <span className="font-normal text-ink-muted"> — {h.reason}</span> : null}</p>
                      <p className="text-xs text-ink-faint">{new Date(h.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
