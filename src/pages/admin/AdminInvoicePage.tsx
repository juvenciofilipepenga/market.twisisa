import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import type { InvoiceSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Form = Omit<InvoiceSettings, "vatRatePercent"> & { vatRatePercent: string };
const textArea = "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none sm:text-sm";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ImagePicker({ label, url, accept, onPick, onClear, busy, uploadLabel, removeLabel, light }: { label: string; url: string | null; accept: string; onPick: (file: File) => void; onClear: () => void; busy: boolean; uploadLabel: string; removeLabel: string; light?: boolean }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-muted">{label}</p>
      <div className="flex items-center gap-3">
        <span className={`flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border p-1.5 ${light ? "bg-white" : "bg-elevated"}`}>
          {url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-ink-faint">—</span>}
        </span>
        <label className={`press inline-flex h-10 cursor-pointer items-center rounded-xl border border-border bg-elevated px-3 text-sm font-semibold hover:border-ink-faint ${busy ? "opacity-50" : ""}`}>
          {busy ? "…" : uploadLabel}
          <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
        </label>
        {url && <button type="button" onClick={onClear} className="press h-10 rounded-xl px-2 text-sm text-ink-muted hover:text-danger">{removeLabel}</button>}
      </div>
    </div>
  );
}

// Fatura do admin: dados da loja, NUIT, logótipo, assinatura, numeração e textos. Cada fatura emitida guarda uma cópia
// destes dados no momento da emissão, por isso editar aqui nunca reescreve faturas antigas.
export default function AdminInvoicePage() {
  const { t } = useLocale();
  const { token } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "signature" | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin.invoiceSettings.get(token).then((s) => setForm({ ...s, vatRatePercent: String(Number(s.vatRatePercent)) })).catch(() => toast.show(t("admin.invoice.error"), { tone: "error", key: "inv" }));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <div className="space-y-3"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const text = (key: keyof Form) => ({ value: (form[key] as string | null) ?? "", onChange: (e: { target: { value: string } }) => set(key, e.target.value as never) });

  async function upload(kind: "logo" | "signature", file: File) {
    if (!token) return;
    setUploading(kind);
    try {
      const res = await api.media.upload(file, token);
      set(kind === "logo" ? "logoUrl" : "signatureUrl", res.url);
    } catch {
      toast.show(t("admin.invoice.error"), { tone: "error", key: "inv-up" });
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!token || !form) return;
    setSaving(true);
    setErrorField(null);
    try {
      const { nextNumber: _ignored, ...rest } = form;
      void _ignored;
      const saved = await api.admin.invoiceSettings.update(token, { ...rest, vatRatePercent: Number(form.vatRatePercent || 0) });
      setForm({ ...saved, vatRatePercent: String(Number(saved.vatRatePercent)) });
      toast.show(t("admin.invoice.saved"), { key: "inv" });
    } catch (err) {
      setErrorField((err as { data?: { field?: string } }).data?.field ?? null);
      toast.show(t("admin.invoice.error"), { tone: "error", key: "inv" });
    } finally {
      setSaving(false);
    }
  }

  async function openPreview() {
    if (!token) return;
    try {
      const blob = await api.admin.invoiceSettings.previewPdf(token);
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    } catch {
      toast.show(t("admin.invoice.error"), { tone: "error", key: "inv-prev" });
    }
  }

  const err = (field: string) => (errorField === field ? t("admin.invoice.error") : null);
  const accent = /^#[0-9a-fA-F]{6}$/.test(form.accentColor) ? form.accentColor : "#EE0006";
  const issuerLines = [form.legalName, form.nuit ? `NUIT ${form.nuit}` : null, [form.address, form.city].filter(Boolean).join(", "), [form.phone, form.email].filter(Boolean).join(" · "), form.website].filter(Boolean);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("admin.invoice.title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("admin.invoice.intro")}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          <Section title={t("admin.invoice.company")}>
            <Field label={t("admin.invoice.companyName")} {...text("companyName")} error={err("companyName")} />
            <Field label={t("admin.invoice.legalName")} {...text("legalName")} />
            <Field label={t("admin.invoice.nuit")} hint={t("admin.invoice.nuitHint")} inputMode="numeric" maxLength={9} value={form.nuit ?? ""} onChange={(e) => set("nuit", e.target.value.replace(/\D/g, "").slice(0, 9))} error={err("nuit")} />
            <Field label={t("admin.invoice.address")} {...text("address")} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("admin.invoice.city")} {...text("city")} />
              <Field label={t("admin.invoice.phone")} type="tel" {...text("phone")} />
            </div>
            <Field label={t("admin.invoice.email")} type="email" {...text("email")} error={err("email")} />
            <Field label={t("admin.invoice.website")} {...text("website")} />
          </Section>

          <Section title={t("admin.invoice.identity")}>
            <ImagePicker label={t("admin.invoice.logo")} url={form.logoUrl} accept="image/png,image/jpeg,image/webp" busy={uploading === "logo"} uploadLabel={t("admin.invoice.upload")} removeLabel={t("admin.invoice.remove")} light onPick={(f) => upload("logo", f)} onClear={() => set("logoUrl", null)} />
            <div>
              <label htmlFor="inv-accent" className="mb-1.5 block text-sm font-medium text-ink-muted">{t("admin.invoice.accent")}</label>
              <div className="flex items-center gap-3">
                <input id="inv-accent" type="color" value={accent} onChange={(e) => set("accentColor", e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1" />
                <span className="font-mono text-sm text-ink-muted">{accent}</span>
              </div>
            </div>
          </Section>

          <Section title={t("admin.invoice.signature")}>
            <ImagePicker label={t("admin.invoice.signatureImage")} url={form.signatureUrl} accept="image/png,image/jpeg" busy={uploading === "signature"} uploadLabel={t("admin.invoice.upload")} removeLabel={t("admin.invoice.remove")} light onPick={(f) => upload("signature", f)} onClear={() => set("signatureUrl", null)} />
            <Field label={t("admin.invoice.signerName")} {...text("signerName")} />
            <Field label={t("admin.invoice.signerRole")} {...text("signerRole")} />
            <label className="flex min-h-[44px] items-center gap-3 text-sm">
              <input type="checkbox" checked={form.showSignature} onChange={(e) => set("showSignature", e.target.checked)} className="h-5 w-5 accent-[rgb(var(--c-primary))]" />
              {t("admin.invoice.showSignature")}
            </label>
          </Section>

          <Section title={t("admin.invoice.numbering")}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("admin.invoice.prefix")} maxLength={8} value={form.numberPrefix} onChange={(e) => set("numberPrefix", e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())} error={err("numberPrefix")} />
              <Field label={t("admin.invoice.next")} readOnly value={`${form.numberPrefix}-${new Date().getFullYear()}-${String(form.nextNumber).padStart(6, "0")}`} />
            </div>
            <Field label={t("admin.invoice.vat")} hint={t("admin.invoice.vatHint")} inputMode="decimal" value={form.vatRatePercent} onChange={(e) => set("vatRatePercent", e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))} error={err("vatRatePercent")} />
          </Section>

          <Section title={t("admin.invoice.texts")}>
            {([["footerNote", "admin.invoice.footer", 2], ["terms", "admin.invoice.terms", 3], ["bankDetails", "admin.invoice.bank", 3]] as const).map(([key, label, rows]) => (
              <div key={key}>
                <label htmlFor={`inv-${key}`} className="mb-1.5 block text-sm font-medium text-ink-muted">{t(label)}</label>
                <textarea id={`inv-${key}`} rows={rows} className={textArea} {...text(key)} />
              </div>
            ))}
          </Section>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" loading={saving} onClick={save}>{t("admin.invoice.save")}</Button>
            <Button size="lg" variant="secondary" onClick={openPreview}>{t("admin.invoice.preview")}</Button>
            <p className="w-full text-xs text-ink-faint">{t("admin.invoice.previewHint")}</p>
          </div>
        </div>

        {/* Pré-visualização ao vivo (aproximação do PDF: muda enquanto escreve) */}
        <aside className="lg:sticky lg:top-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{t("admin.invoice.live")}</p>
          <div className="overflow-hidden rounded-xl bg-white text-[#1A1412] shadow-lg shadow-black/30">
            <div className="h-1.5" style={{ background: accent }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                {form.logoUrl ? <img src={form.logoUrl} alt="" className="h-10 max-w-[7rem] object-contain" /> : <p className="text-base font-extrabold">{form.companyName || "—"}</p>}
                <div className="text-right"><p className="text-lg font-extrabold" style={{ color: accent }}>{t("admin.invoice.invoice")}</p><p className="text-[10px] text-[#6B605B]">{form.numberPrefix}-{new Date().getFullYear()}-{String(form.nextNumber).padStart(6, "0")}</p></div>
              </div>
              <div className="mt-2 space-y-px text-[10px] leading-snug text-[#6B605B]">{issuerLines.map((l) => <p key={String(l)}>{l}</p>)}</div>
              <div className="my-3 h-px bg-[#E6DFDA]" />
              <p className="text-[9px] font-bold uppercase text-[#6B605B]">Facturado a</p>
              <p className="text-xs font-bold">{t("admin.invoice.sampleCustomer")}</p>
              <div className="mt-3 border-b border-[#1A1412] pb-1 text-[9px] font-bold uppercase text-[#6B605B]">Descrição</div>
              <div className="flex justify-between border-b border-[#E6DFDA] py-1.5 text-[11px]"><span>Produto de exemplo × 2</span><span>2 500,00 MT</span></div>
              <div className="mt-2 flex items-center justify-between border-t-2 pt-2" style={{ borderColor: accent }}>
                <span className="rounded border-2 border-[#1E9E5A] px-2 py-0.5 text-[10px] font-extrabold text-[#1E9E5A]">{t("admin.invoice.paid")}</span>
                <span className="text-sm font-extrabold">{t("admin.invoice.total")} 2 500,00 MT</span>
              </div>
              {form.showSignature && (form.signatureUrl || form.signerName) && (
                <div className="mt-5 ml-auto w-36 text-center">
                  {form.signatureUrl && <img src={form.signatureUrl} alt="" className="mx-auto h-9 object-contain" />}
                  <div className="border-t border-[#1A1412] pt-0.5 text-[10px] font-bold">{form.signerName}</div>
                  <div className="text-[9px] text-[#6B605B]">{form.signerRole}</div>
                </div>
              )}
              <p className="mt-4 border-t border-[#E6DFDA] pt-2 text-center text-[9px] text-[#6B605B]">{form.footerNote || `Obrigado pela sua compra em ${form.companyName}.`}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
