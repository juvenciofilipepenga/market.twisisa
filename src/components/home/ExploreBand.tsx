import { useLocale } from "@/i18n/LocaleContext";
import { useCategories } from "@/lib/useCategories";
import { img } from "@/lib/images";
import { CategoryChips } from "../layout/CategoryChips";

// Cartão de exploração: identidade visual contemporânea, sem faixa decorativa, com brilho subtil e mascote.
export function ExploreBand() {
  const { t } = useLocale();
  const categories = useCategories();

  if (categories !== null && categories.length === 0) return null;

  return (
    <section aria-labelledby="explore-title" className="explore-card group relative mx-4 mt-5 overflow-hidden rounded-3xl border border-border bg-surface">
      <div aria-hidden="true" className="explore-glow pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full" />
      <div className="relative p-4 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="explore-mascot relative flex h-[5.25rem] w-[5.25rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] bg-elevated ring-1 ring-border sm:h-28 sm:w-28 sm:rounded-[2rem]">
            <span aria-hidden="true" className="absolute inset-2 rounded-[1.2rem] border border-primary/20" />
            <img src={img.mascotExplore} alt="" width={512} height={512} loading="lazy" className="relative z-10 h-full w-full object-contain object-bottom" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="mb-1 inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Twisisa Market</span>
            <h2 id="explore-title" className="explore-title text-lg font-extrabold leading-tight sm:text-2xl">{t("explore.title")}</h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">{t("explore.body")}</p>
          </div>
        </div>
        <div className="relative mt-5 border-t border-border/70 pt-4 sm:mt-6 sm:pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-ink-muted sm:text-sm">Explore por categoria</span>
            <span aria-hidden="true" className="explore-spark text-primary">✳</span>
          </div>
          <CategoryChips embedded />
        </div>
      </div>
    </section>
  );
}
