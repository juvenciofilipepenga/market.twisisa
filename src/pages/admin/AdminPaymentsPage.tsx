import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import type { PaymentSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { PendingManualPayments } from "@/components/admin/PendingManualPayments";
import { useToast } from "@/components/ui/Toast";

const textArea = "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none sm:text-sm";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Switch({ checked, onChange, label, help, busy }: { checked: boolean; onChange: (v: boolean) => void; label: string; help: string; busy?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-ink-muted">{help}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={busy} onClick={() => onChange(!checked)}
        className={`press relative h-8 w-14 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${checked ? "border-success bg-success" : "border-border bg-elevated"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${checked ? "left-[1.625rem]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

type Form = Omit<PaymentSettings, "onlineStatus" | "zpFailures" | "zpDegradedUntil">;
const pick = (s: PaymentSettings): Form => ({
  onlineEnabled: s.onlineEnabled, manualEnabled: s.manualEnabled, mpesaNumber: s.mpesaNumber, mpesaName: s.mpesaName, emolaNumber: s.emolaNumber, emolaName: s.emolaName,
  bankName: s.bankName, bankNib: s.bankNib, bankHolder: s.bankHolder, instructions: s.instructions
});

// Interruptores e dados de recebimento. Os interruptores gravam NA HORA (é o botão de emergência quando o ZumboPay falha);
// os dados de recebimento gravam com o botão Guardar.
export default function AdminPaymentsPage() {
  const { t, locale } = useLocale();
  const { token } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState<PaymentSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin.paymentSettings.get(token).then((s) => { setSaved(s); setForm(pick(s)); }).catch(() => toast.show(t("admin.payset.error"), { tone: "error", key: "ps" }));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!saved || !form) return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const text = (key: keyof Form) => ({ value: (form[key] as string | null) ?? "", onChange: (e: { target: { value: string } }) => set(key, e.target.value as never) });
  const err = (field: string) => (errorField === field ? t("admin.payset.error") : null);

  async function persist(next: Form, okMessage: string) {
    if (!token) return;
    setBusy(true);
    setErrorField(null);
    try {
      const res = await api.admin.paymentSettings.update(token, next);
      setSaved(res);
      setForm(pick(res));
      toast.show(okMessage, { key: "ps" });
    } catch (e) {
      setErrorField((e as { data?: { field?: string } }).data?.field ?? null);
      toast.show(t("admin.payset.error"), { tone: "error", key: "ps" });
    } finally {
      setBusy(false);
    }
  }

  // Interruptor: grava o que está GUARDADO no servidor + o interruptor, para um campo a meio não o impedir.
  const toggle = (key: "onlineEnabled" | "manualEnabled", value: boolean) => persist({ ...pick(saved), [key]: value }, t("admin.payset.saved"));

  async function resetBreaker() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await api.admin.paymentSettings.resetBreaker(token);
      setSaved(res);
      toast.show(t("admin.payset.saved"), { key: "ps" });
    } finally {
      setBusy(false);
    }
  }

  const hasDest = Boolean(saved.mpesaNumber || saved.emolaNumber || saved.bankNib);
  const until = saved.zpDegradedUntil ? new Date(saved.zpDegradedUntil).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) : "";
  const tone = saved.onlineStatus === "ok" ? "border-success/40 bg-success/10 text-success" : saved.onlineStatus === "degraded" ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-elevated text-ink-muted";

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.payset.title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("admin.payset.intro")}</p>

      <div className="mt-5 max-w-xl space-y-4">
        {token && <PendingManualPayments token={token} />}
        <div role="status" className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${tone}`}>
          {saved.onlineStatus === "degraded" ? `${t("admin.payset.status.degraded")} ${until}` : t(`admin.payset.status.${saved.onlineStatus}`)}
          {saved.onlineStatus === "degraded" && <Button className="mt-2 w-full" variant="secondary" loading={busy} onClick={resetBreaker}>{t("admin.payset.reset")}</Button>}
        </div>

        <Section title={t("admin.payset.switches")}>
          <Switch checked={saved.onlineEnabled} busy={busy} onChange={(v) => toggle("onlineEnabled", v)} label={t("admin.payset.online")} help={t("admin.payset.onlineHelp")} />
          <Switch checked={saved.manualEnabled} busy={busy} onChange={(v) => toggle("manualEnabled", v)} label={t("admin.payset.manual")} help={t("admin.payset.manualHelp")} />
          {saved.manualEnabled && !hasDest && <p role="alert" className="rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning">{t("admin.payset.noDest")}</p>}
        </Section>

        <Section title={t("admin.payset.dest")}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("admin.payset.mpesaNumber")} inputMode="numeric" maxLength={12} {...text("mpesaNumber")} error={err("mpesaNumber")} />
            <Field label={t("admin.payset.mpesaName")} maxLength={80} {...text("mpesaName")} />
            <Field label={t("admin.payset.emolaNumber")} inputMode="numeric" maxLength={12} {...text("emolaNumber")} error={err("emolaNumber")} />
            <Field label={t("admin.payset.emolaName")} maxLength={80} {...text("emolaName")} />
          </div>
          <Field label={t("admin.payset.bankNib")} inputMode="numeric" maxLength={30} {...text("bankNib")} error={err("bankNib")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("admin.payset.bankName")} maxLength={80} {...text("bankName")} />
            <Field label={t("admin.payset.bankHolder")} maxLength={80} {...text("bankHolder")} />
          </div>
          <div>
            <label htmlFor="ps-instr" className="mb-1.5 block text-sm font-medium text-ink-muted">{t("admin.payset.instructions")}</label>
            <textarea id="ps-instr" rows={3} maxLength={600} className={textArea} {...text("instructions")} />
          </div>
          <Button size="lg" loading={busy} onClick={() => persist(form, t("admin.payset.saved"))}>{t("admin.payset.save")}</Button>
        </Section>
      </div>
    </div>
  );
}
