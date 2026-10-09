import { useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { adminError } from "@/lib/errors";
import type { Order } from "@/lib/types";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";

export const TRACKABLE = ["PAID", "PROCESSING", "READY_FOR_SHIPMENT", "SHIPPED", "OUT_FOR_DELIVERY"];

// O admin publica "por onde está" e "quando chega". O cliente vê tudo na página da encomenda e recebe uma notificação.
export function OrderTrackingForm({ order, token, onUpdated }: { order: Order; token: string; onUpdated: (o: Order) => void }) {
  const { t } = useLocale();
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [eta, setEta] = useState(order.estimatedDeliveryAt ? order.estimatedDeliveryAt.slice(0, 10) : "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [code, setCode] = useState(order.trackingCode ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function publish() {
    setBusy(true);
    setMsg(null);
    try {
      const clean = (v: string) => (v.trim() ? v.trim() : undefined);
      const updated = await api.admin.orders.addTracking(token, order.id, {
        location: clean(location), note: clean(note), estimatedDeliveryAt: clean(eta), carrier: clean(carrier), trackingCode: clean(code)
      });
      onUpdated(updated);
      setLocation(""); setNote("");
      setMsg({ ok: true, text: t("admin.track.saved") });
    } catch (err) {
      setMsg({ ok: false, text: adminError(err, t) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs font-semibold text-ink-muted">{t("admin.track.title")}</p>
      <Field label={t("admin.track.location")} value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Armazém de Nampula" />
      <Field label={t("admin.track.note")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("admin.track.eta")} type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
        <Field label={t("admin.track.carrier")} value={carrier} maxLength={60} onChange={(e) => setCarrier(e.target.value)} />
      </div>
      <Field label={t("admin.track.code")} value={code} maxLength={60} onChange={(e) => setCode(e.target.value)} />
      <div className="flex items-center gap-3">
        <Button variant="secondary" loading={busy} disabled={!location.trim() && !note.trim() && !eta && !carrier.trim() && !code.trim()} onClick={publish}>{t("admin.track.publish")}</Button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-xs ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
