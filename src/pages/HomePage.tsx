import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CategoryChips } from "@/components/layout/CategoryChips";
import { Hero } from "@/components/home/Hero";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { TrustBar } from "@/components/home/TrustBar";
import { CatalogSection } from "@/components/home/CatalogSection";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const hasFilter = Boolean(searchParams.get("search") || searchParams.get("categoryId"));

  return (
    <main className="pb-6">
      <Header />
      <div className="mx-auto max-w-6xl">
        {!hasFilter && <Hero />}
        <CategoryChips />
        {!hasFilter && (
          <>
            <FeaturedSection />
            <TrustBar />
          </>
        )}
        <CatalogSection />
      </div>
    </main>
  );
}
