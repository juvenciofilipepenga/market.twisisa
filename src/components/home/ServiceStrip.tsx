import type { ReactNode } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { WalletIcon, ClipboardIcon, ChatIcon } from "../icons";

// Substitui a antiga secção "Promoções", que era sempre um estado vazio (o backend ainda não tem
// descontos). Mostra o que a loja realmente oferece hoje: pagamentos, acompanhamento e chat.
export function ServiceStrip() {
  const { t } = useLocale();
  const items: Array<{ icon: ReactNode; title: string; body: string }> = [
    { icon: <WalletIcon width={20} height={20} />, title: t("home.services.pay.title"), body: t("home.services.pay.body") },
    { icon: <ClipboardIcon width={20} height={20} />, title: t("home.services.track.title"), body: t("home.services.track.body") },
    { icon: <ChatIcon width={20} height={20} />, title: t("home.services.chat.title"), body: t("home.services.chat.body") }
  ];
  return (
    <section className="px-4 py-4">
      <div className="grid divide-y divide-border rounded-2xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-4">
            <div className="shrink-0 rounded-xl bg-primary-soft p-2.5 text-primary-text">{item.icon}</div>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
