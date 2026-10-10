import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import type { PendingReviewPayment } from "@/lib/types";
import { spaced } from "../payment/StoreCard";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

function ago(iso: string, t: (k: string) => string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return (mins < 60 ? `${t("admin.payset.ago")} ${mins} min` : `${t("admin.payset.ago")} ${Math.floor(mins / 60)} h ${mins % 60} min`).trim();
}

// A lista de trabalho do admin no pagamento manual: SÓ os pedidos em que o cliente carregou em "Já paguei".
// A decisão é sempre humana: o admin confere NO HISTÓRICO DA SUA CONTA se entrou aquele valor, daquele número, àquela hora.
export function PendingManualPayments({ token }: { token: string }) {
  const { t, locale } = useLocale();
  const toast = useToast();
  const [items, setItems] = useState<PendingReviewPayment[] | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => api.admin.payments.pendingReview(token).then(setItems).catch(() => undefined), [token]);
  useEffect(() => {
    void load();
    const id = window.setInterval(load, 20_000);
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  async function decide(p: PendingReviewPayment, approved: boolean) {
    setBusy(p.id);
    try {
      await api.admin.payments.review(token, p.id, approved, notes[p.id]?.trim() || undefined);
      toast.show(t(approved ? "admin.payset.approved" : "admin.payset.rejected"), { key: "pr" });
      await load();
    } catch {
      toast.show(t("admin.payset.error"), { tone: "error", key: "pr" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
        {t("admin.payset.pending")}
        {items && items.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{items.length}</span>}
      </h2>
      {items === null && <p className="text-sm text-ink-muted">…</p>}
      {items?.length === 0 && <p className="text-sm text-ink-muted">{t("admin.payset.pendingEmpty")}</p>}
      <div className="space-y-3">
        {items?.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-elevated p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-2xl font-extrabold tabular-nums">{formatMzn(p.amountMzn)}</p>
              <p className="text-xs text-ink-muted">{p.method === "EMOLA" ? "e-Mola" : "M-Pesa"} · {ago(p.claimedAt, t)}</p>
            </div>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.payset.payer")}</dt><dd className="min-w-0 truncate font-semibold">{p.payerName ?? p.customerName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.payset.number")}</dt><dd className="font-mono font-semibold">{p.paymentNumber ? spaced(p.paymentNumber) : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("pay.order")}</dt><dd className="font-mono text-xs">{p.orderNumber}</dd></div>
              {p.transactionCode && <div className="flex justify-between gap-3"><dt className="text-ink-muted">{t("admin.orders.code")}</dt><dd className="font-mono text-xs font-semibold">{p.transactionCode}</dd></div>}
            </dl>
            <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted">
              {t("admin.payset.checkHint")} <span className="font-semibold text-ink">{formatMzn(p.amountMzn)}</span> · {p.paymentNumber ? spaced(p.paymentNumber) : "—"} · {new Date(p.claimedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
            </p>
            <label className="mt-3 flex min-h-[44px] items-start gap-3 text-sm">
              <input type="checkbox" checked={Boolean(checked[p.id])} onChange={(e) => setChecked((c) => ({ ...c, [p.id]: e.target.checked }))} className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--c-primary))]" />
              {t("admin.payset.confirmCheck")}
            </label>
            <input value={notes[p.id] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))} placeholder={t("admin.payset.rejectNote")} maxLength={200}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-ink-faint focus:outline-none" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button loading={busy === p.id} disabled={!checked[p.id]} onClick={() => decide(p, true)}>{t("admin.payset.approve")}</Button>
              <Button variant="danger" disabled={busy === p.id} onClick={() => decide(p, false)}>{t("admin.payset.reject")}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
