import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

const KEY = "twisisa:settings";
type Settings = { compactMotion: boolean; installPrompts: boolean; orderUpdates: boolean; marketing: boolean };
const defaults: Settings = { compactMotion: false, installPrompts: true, orderUpdates: true, marketing: false };

export default function SettingsPage() {
  const { locale, t } = useLocale();
  useDocumentMeta({ title: `${locale === "pt" ? "Definições" : "Settings"} · Twisisa Market`, noindex: true });
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => { try { setSettings({ ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch {} }, []);
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value }; setSettings(next); localStorage.setItem(KEY, JSON.stringify(next));
    if (key === "compactMotion") document.documentElement.dataset.compactMotion = value ? "1" : "0";
  }
  const rows: Array<[keyof Settings, string, string]> = [
    ["orderUpdates", locale === "pt" ? "Actualizações de encomendas" : "Order updates", locale === "pt" ? "Receber notificações sobre o estado das suas compras." : "Receive order status notifications."],
    ["marketing", locale === "pt" ? "Ofertas e novidades" : "Offers and news", locale === "pt" ? "Notificações promocionais opcionais." : "Optional promotional notifications."],
    ["installPrompts", locale === "pt" ? "Lembretes de instalação" : "Install reminders", locale === "pt" ? "Mostrar o convite para instalar quando for relevante." : "Show the install prompt when relevant."],
    ["compactMotion", locale === "pt" ? "Movimento reduzido" : "Reduced motion", locale === "pt" ? "Reduz animações e transições da interface." : "Reduce interface animations and transitions."],
  ];
  return <main className="pb-10"><Header /><div className="mx-auto max-w-2xl px-4 py-5">
    <h1 className="text-2xl font-extrabold">{locale === "pt" ? "Definições" : "Settings"}</h1>
    <p className="mt-1 text-sm text-ink-muted">{locale === "pt" ? "Controla a experiência da aplicação." : "Control your app experience."}</p>
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface divide-y divide-border">
      {rows.map(([key, title, description]) => <label key={key} className="flex cursor-pointer items-center gap-4 p-4 hover:bg-elevated">
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-ink-muted">{description}</span></span>
        <input type="checkbox" checked={settings[key]} onChange={e => update(key, e.target.checked)} className="h-5 w-5 accent-primary" />
      </label>)}
    </section>
    <Button variant="secondary" className="mt-4" onClick={() => { setSettings(defaults); localStorage.setItem(KEY, JSON.stringify(defaults)); }}>{locale === "pt" ? "Repor definições" : "Reset settings"}</Button>
  </div></main>;
}
