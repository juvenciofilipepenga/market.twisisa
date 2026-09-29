import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiError, type InitiatePaymentPayload } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
    const blob = await api.invoices.downloadPdf(order.invoice.id, token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.invoice.invoiceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activePayment = order && order !== "not-found"
    ? order.payments?.find((p) => !["FAILED", "CANCELLED", "REFUNDED", "PAYMENT_REJECTED", "REFUNDED_LEGACY"].includes(p.status))
    : undefined;

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeftIcon width={16} height={16} />{t("common.backHome")}
        </button>

        {order === null && <div className="space-y-2"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-32 w-full" /></div>}
        {order === "not-found" && <EmptyState title={t("order.notFound")} icon={<ClipboardIcon width={26} height={26} />} />}

        {order && order !== "not-found" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{order.orderNumber}</h1>
                <p className="text-xs text-ink-faint">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-muted">{t("order.items")}</h2>
              <div className="space-y-1.5">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}× {item.productName}</span>
                    <span className="text-ink-muted">{formatMzn(item.subtotalMzn)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-ink-muted"><span>{t("order.subtotal")}</span><span>{formatMzn(order.subtotalMzn)}</span></div>
                <div className="flex justify-between text-ink-muted"><span>{t("order.shipping")}</span><span>{formatMzn(order.shippingMzn)}</span></div>
                {Number(order.discountMzn) > 0 && <div className="flex justify-between text-ink-muted"><span>{t("order.discount")}</span><span>-{formatMzn(order.discountMzn)}</span></div>}
                <div className="flex justify-between text-base font-bold"><span>{t("order.total")}</span><span>{formatMzn(order.totalMzn)}</span></div>
              </div>
            </div>

            {order.status === "PENDING_PAYMENT" && !activePayment && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-3 text-sm font-semibold">{t("payment.chooseMethod")}</h2>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {(["MPESA", "EMOLA", "CARD", "GATEWAY"] as Method[]).map((m) => (
                    <button key={m} onClick={() => setMethod(m)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${method === m ? "border-primary bg-primary/10 text-primary" : "border-border text-ink-muted"}`}>
                      {t(`payment.${m === "GATEWAY" ? "gateway" : m.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
                {(method === "MPESA" || method === "EMOLA") && (
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("payment.phoneNumber")}
                    className="mb-3 w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                )}
                {initiateError && <p className="mb-2 text-xs text-danger">{initiateError}</p>}
                <Button className="w-full" onClick={initiatePayment} disabled={initiating || ((method === "MPESA" || method === "EMOLA") && phone.trim().length < 9)}>
                  {t("payment.initiate")}
                </Button>
                {checkoutUrl && (
                  <a href={checkoutUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-sm font-semibold text-primary underline">
                    {t("payment.gateway")} →
                  </a>
                )}
              </div>
            )}

            {activePayment && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <h2 className="mb-2 text-sm font-semibold">{t("payment.title")}</h2>
                <p className="text-xs text-ink-faint">{t("payment.reference")}: {activePayment.reference}</p>
                <p className="mt-1 text-sm">{t("payment.status")}: <span className="font-semibold">{activePayment.status}</span></p>
                {activePayment.status === "PROOF_SUBMITTED" || activePayment.status === "UNDER_REVIEW" ? (
                  <p className="mt-2 text-xs text-warning">{t("payment.proofSubmitted")}</p>
                ) : activePayment.provider === "MANUAL" && !activePayment.proofUrl ? (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs text-ink-muted">{t("payment.uploadProof")}</label>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-elevated file:px-3 file:py-2 file:text-xs file:text-ink" />
                    <Button variant="secondary" disabled={!proofFile || submittingProof} onClick={() => submitProof(activePayment.id)}>
                      {t("payment.submitProof")}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}

            {order.invoice && (
              <Button variant="secondary" onClick={downloadInvoice} className="w-full">
                {t("order.downloadInvoice")}
              </Button>
            )}

            {CANCELLABLE.has(order.status) && (
              <div className="rounded-xl border border-danger/30 p-4">
                {!showCancelForm ? (
                  <Button variant="danger" className="w-full" onClick={() => setShowCancelForm(true)}>{t("order.cancel")}</Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-ink-muted">{t("order.cancelConfirm")}</p>
                    <input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t("order.cancelReason")}
                      className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => setShowCancelForm(false)}>{t("common.cancel")}</Button>
                      <Button variant="danger" className="flex-1" disabled={cancelReason.trim().length < 3 || cancelling} onClick={cancelOrder}>{t("order.cancel")}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-ink-muted">{t("order.history")}</h2>
                <div className="space-y-1.5 text-xs text-ink-faint">
                  {order.statusHistory.map((h) => (
                    <div key={h.id} className="flex justify-between">
                      <span>{h.to}{h.reason ? ` — ${h.reason}` : ""}</span>
                      <span>{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
