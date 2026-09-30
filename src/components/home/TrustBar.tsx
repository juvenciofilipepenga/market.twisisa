import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";

// Três factos reais da loja, em linha, pequenos e alinhados (sem cartões): pagamento, acompanhamento e chat.
export function TrustBar() {
  const { t } = useLocale();
  const items = [
    { src: img.phone, cls: "object-contain", title: t("home.services.pay.title"), body: t("home.services.pay.body") },
    { src: img.box, cls: "object-contain", title: t("home.services.track.title"), body: t("home.services.track.body") },
    { src: img.mascotPayment, cls: "rounded-full bg-primary-active object-cover object-[50%_12%]", title: t("home.services.chat.title"), body: t("home.services.chat.body") }
  ];
  return (
    <section aria-label={t("footer.help")} className="mx-4 my-4 grid gap-x-8 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3">
          <img src={item.src} alt="" width={40} height={40} loading="lazy" className={`h-10 w-10 shrink-0 ${item.cls}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{item.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
