import type { CSSProperties } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { SpeedLines } from "../brand/SpeedLines";
import { ArrowRightIcon } from "../icons";
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
        {/* Halo por trás da mascote: gradiente radial (barato) em vez de blur */}
        <div aria-hidden="true" className="halo pointer-events-none absolute -bottom-10 -right-6 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.28),transparent)] md:-bottom-16 md:right-4 md:h-96 md:w-96" />
        <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 pl-5 pt-8 md:pl-10 md:pt-12">
          <div className="pb-6 md:pb-10">
            <h1 className="rise max-w-md text-[1.75rem] font-extrabold leading-[1.08] text-white md:text-5xl" style={{ "--d": "80ms" } as CSSProperties}>{t("hero.title")}</h1>
            <p className="rise mt-3 max-w-sm text-sm leading-relaxed text-white md:text-base" style={{ "--d": "200ms" } as CSSProperties}>{t("hero.body")}</p>
            <button
              onClick={goToCatalog}
              className="rise press nudge-arrow mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary-active hover:bg-ink"
              style={{ "--d": "320ms" } as CSSProperties}
            >
              {t("hero.cta")}<ArrowRightIcon className="arrow" width={18} height={18} />
            </button>
          </div>
          <img src={img.mascotPayment} alt="" width={900} height={952} fetchPriority="high" className="float relative h-36 w-36 object-contain object-bottom sm:h-48 sm:w-48 md:h-72 md:w-72" />
        </div>
      </div>
    </section>
  );
}
