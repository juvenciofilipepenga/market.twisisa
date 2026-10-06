import { useLocale } from "@/i18n/LocaleContext";
import type { ReactNode } from "react";
import { img } from "@/lib/images";
import { ChatIcon } from "../icons";

// Três factos reais da loja, em linha, pequenos e alinhados (sem cartões): pagamento, acompanhamento e chat.
export function TrustBar() {
  const { t } = useLocale();
  const items: Array<{ visual: ReactNode; title: string; body: string }> = [
    { visual: <img src={img.shield} alt="" width={40} height={48} loading="lazy" className="h-10 w-10 shrink-0 object-contain" />, title: t("home.services.pay.title"), body: t("home.services.pay.body") },
    { visual: <img src={img.box} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 shrink-0 object-contain" />, title: t("home.services.track.title"), body: t("home.services.track.body") },
    { visual: <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text"><ChatIcon width={20} height={20} /></span>, title: t("home.services.chat.title"), body: t("home.services.chat.body") }
  ];
  return (
    <section aria-label={t("footer.help")} className="mx-4 my-4 grid gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          {item.visual}
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{item.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
