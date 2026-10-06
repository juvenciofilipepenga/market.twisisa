import { useLocale } from "@/i18n/LocaleContext";
import { useFeaturedProducts } from "@/lib/useFeaturedProducts";
import { ProductCard } from "../product/ProductCard";
import { Skeleton } from "../ui/Skeleton";

// Fila "Destaques": os produtos que o slider do topo não mostra (mesma fonte, ver lib/useFeaturedProducts.ts).
export function FeaturedSection() {
  const { t } = useLocale();
  const { ready, more } = useFeaturedProducts();

  if (ready && more.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="mb-3 px-4 text-xl font-bold">{t("home.featured")}</h2>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4">
        {!ready
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-40 shrink-0 rounded-2xl sm:w-48" />)
          : more.map((p) => (
            <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48"><ProductCard product={p} /></div>
          ))}
      </div>
    </section>
  );
}
