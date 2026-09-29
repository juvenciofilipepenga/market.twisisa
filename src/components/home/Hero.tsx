import { useLocale } from "@/i18n/LocaleContext";
import { SpeedLines } from "../brand/SpeedLines";
import { img } from "@/lib/images";

export function Hero() {
  const { t } = useLocale();

  function goToCatalog() {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="px-4 pt-2">
      <div className="relative overflow-hidden rounded-3xl bg-primary-active">
        <SpeedLines className="pointer-events-none absolute -left-8 top-5 h-28 w-44 text-white/15 md:left-4 md:h-40 md:w-64" />
        <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 pl-5 pt-8 md:pl-10 md:pt-12">
          <div className="pb-6 md:pb-10">
            <h1 className="max-w-md text-[1.75rem] font-extrabold leading-[1.08] text-white md:text-5xl">{t("hero.title")}</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white md:text-base">{t("hero.body")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["M-Pesa", "e-Mola", t("hero.card")].map((m) => (
                <span key={m} className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white">{m}</span>
              ))}
            </div>
            <button onClick={goToCatalog} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-active transition-colors hover:bg-ink">
              {t("hero.cta")}
            </button>
          </div>
          <img src={img.mascotPayment} alt="" width={900} height={952} fetchPriority="high" className="h-36 w-36 object-contain object-bottom sm:h-48 sm:w-48 md:h-72 md:w-72" />
        </div>
      </div>
    </section>
  );
}
