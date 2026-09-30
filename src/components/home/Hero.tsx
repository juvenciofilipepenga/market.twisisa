import { useEffect, useRef, type CSSProperties } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import { SpeedLines } from "../brand/SpeedLines";
import { Button } from "../ui/Button";
import { ArrowRightIcon } from "../icons";

const vars = (o: Record<string, string>) => o as CSSProperties;

// O hero é a única peça "cenográfica" da loja: painel vermelho, mascote e objectos 3D que se afastam a
// velocidades diferentes quando se faz scroll (profundidade). O JS só escreve UMA variável (--p, 0 a 1);
// todo o movimento é CSS de transform. Com prefers-reduced-motion nada se mexe.
export function Hero() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height || 1)));
      el.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  function goToCatalog() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("catalogo")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <section className="px-4 pt-2">
      <div ref={ref} className="relative overflow-hidden rounded-3xl bg-primary-active">
        <div className="px-x pointer-events-none absolute -left-8 top-5 md:left-4" style={vars({ "--dx": "-70px" })}>
          <SpeedLines className="h-28 w-44 text-white/15 md:h-40 md:w-64" />
        </div>

        {/* Objectos 3D: em telemóvel só a etiqueta; em ecrã largo os três, no espaço livre entre o texto e a mascote */}
        <img src={img.tag} alt="" width={700} height={879} className="px pointer-events-none absolute right-3 top-3 w-11 sm:right-6 sm:top-5 sm:w-16 md:right-[19rem] md:top-8 md:w-20" style={vars({ "--dy": "-70px", "--rot": "14deg" })} />
        <img src={img.box} alt="" width={700} height={475} className="px pointer-events-none absolute bottom-10 right-[25.5rem] hidden w-24 lg:block" style={vars({ "--dy": "-40px", "--rot": "-10deg" })} />
        <img src={img.cart} alt="" width={700} height={525} className="px pointer-events-none absolute right-[26rem] top-6 hidden w-20 lg:block" style={vars({ "--dy": "-90px", "--rot": "-6deg" })} />

        <div className="relative grid grid-cols-[1fr_auto] items-end gap-2 pl-5 pt-8 md:pl-10 md:pt-12">
          <div className="pb-6 md:pb-10">
            <h1 className="rise max-w-md text-[1.75rem] font-extrabold leading-[1.08] text-white md:text-5xl" style={vars({ "--d": "60ms" })}>{t("hero.title")}</h1>
            <p className="rise mt-3 max-w-sm text-sm leading-relaxed text-white md:text-base" style={vars({ "--d": "160ms" })}>{t("hero.body")}</p>
            <div className="rise mt-4 flex flex-wrap gap-2" style={vars({ "--d": "240ms" })}>
              {["M-Pesa", "e-Mola", t("hero.card")].map((m) => (
                <span key={m} className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white">{m}</span>
              ))}
            </div>
            <div className="rise mt-5" style={vars({ "--d": "320ms" })}>
              <Button variant="light" size="lg" onClick={goToCatalog}>{t("hero.cta")}<ArrowRightIcon width={18} height={18} /></Button>
            </div>
          </div>
          <img src={img.mascotPayment} alt="" width={900} height={952} fetchPriority="high" className="px relative h-36 w-36 object-contain object-bottom sm:h-48 sm:w-48 md:h-72 md:w-72" style={vars({ "--dy": "30px" })} />
        </div>
      </div>
    </section>
  );
}
