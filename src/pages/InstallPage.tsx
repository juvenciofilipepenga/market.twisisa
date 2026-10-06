import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { detectPlatform, useInstall, type InstallPlatform } from "@/lib/install";
import { img } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { CheckIcon, DownloadIcon } from "@/components/icons";

const STEPS: Record<InstallPlatform, number> = { android: 4, ios: 4, desktop: 3 };
const PLATFORMS: InstallPlatform[] = ["android", "ios", "desktop"];

// Mesmos chips das categorias: activo = claro sobre fundo escuro.
const chip = "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors";
const chipOff = "border-border bg-surface text-ink-muted hover:border-ink-faint hover:text-ink";
const chipOn = "border-ink bg-ink text-bg";

export default function InstallPage() {
  const { t, locale } = useLocale();
  useDocumentMeta({ title: `${t("install.title")} · Twisisa Market` });
  const { canPrompt, installed, install } = useInstall();
  const [platform, setPlatform] = useState<InstallPlatform>(detectPlatform);

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary-active">
          <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 pl-5 pt-8 md:pl-10 md:pt-10">
            <div className="pb-6 md:pb-10">
              <h1 className="max-w-xs text-[1.75rem] font-extrabold leading-[1.08] text-white md:text-4xl">{t("install.title")}</h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white md:text-base">{t("install.lead")}</p>
              <div className="mt-5">
                {installed ? (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <CheckIcon width={18} height={18} />{t("install.done")}
                  </p>
                ) : canPrompt ? (
                  <Button variant="light" size="lg" onClick={install}>
                    <DownloadIcon width={18} height={18} />{t("install.cta")}
                  </Button>
                ) : null}
              </div>
            </div>
            <img src={img.phone} alt="" width={700} height={1050} className="pointer-events-none w-28 self-end sm:w-36 md:w-44" />
          </div>
        </div>

        {!installed && !canPrompt && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-extrabold">{locale === "pt" ? "A aplicação está pronta no seu dispositivo." : "The app is ready on your device."}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{locale === "pt" ? "Quando o sistema disponibilizar a instalação nativa, este botão aparecerá aqui. Não é necessário seguir instruções manuais de navegador." : "When the system makes native installation available, the button will appear here. No manual browser instructions are needed."}</p>
          </section>
        )}
      </div>
    </main>
  );
}
