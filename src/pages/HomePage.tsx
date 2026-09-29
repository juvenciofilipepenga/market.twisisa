import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CategoryChips } from "@/components/layout/CategoryChips";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { PromoSection } from "@/components/home/PromoSection";
import { CatalogSection } from "@/components/home/CatalogSection";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const hasFilter = Boolean(searchParams.get("search") || searchParams.get("categoryId"));

  return (
    <main className="pb-10">
      <Header />
      <CategoryChips />
      {!hasFilter && (
        <>
          <FeaturedSection />
          <PromoSection />
        </>
      )}
      <CatalogSection />
    </main>
  );
}
