import { useSearchParams } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { Header } from "@/components/layout/Header";
import { CategoryChips } from "@/components/layout/CategoryChips";
import { Hero } from "@/components/home/Hero";
import { ExploreBand } from "@/components/home/ExploreBand";
import { TrustBar } from "@/components/home/TrustBar";
import { CatalogSection } from "@/components/home/CatalogSection";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  const search = searchParams.get("search");
  const hasFilter = Boolean(search || searchParams.get("categoryId"));
  // Resultados de pesquisa e filtros não se indexam (conteúdo repetido); a página principal sim.
  useDocumentMeta({
    title: search ? `${t("catalog.resultsFor")} “${search}” · Twisisa Market` : t("seo.home.title"),
    description: t("seo.home.description"),
    noindex: hasFilter
  });

  return (
    <main className="pb-6">
      <Header />
      <div className="mx-auto max-w-6xl">
        {/* Descobrir: o que acabou de chegar → explorar por categoria → o catálogo → o que a loja garante.
            Com filtro (pesquisa ou categoria) o cliente já sabe o que quer: ficam só os filtros e os resultados. */}
        {hasFilter ? (
          <CategoryChips />
        ) : (
          <>
            <Hero />
            <ExploreBand />
          </>
        )}
        <CatalogSection />
        {!hasFilter && <TrustBar />}
      </div>
    </main>
  );
}
