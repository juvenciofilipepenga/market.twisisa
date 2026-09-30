import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import type { Product } from "@/lib/types";
import { ProductCard } from "../product/ProductCard";
import { Skeleton } from "../ui/Skeleton";
import { Reveal } from "../ui/Reveal";

// NOTA: o backend ainda não tem um campo "destaque"/"featured" no Produto (ver README.md).
// Enquanto essa opção não existir na base de dados, "Destaques" mostra os produtos mais
// recentes com stock disponível — é um critério temporário, não uma curadoria editorial real.
export function FeaturedSection() {
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    api.products.list({ limit: 8 }).then((res) => {
      setProducts(res.data.filter((p) => p.stock > 0).slice(0, 6));
    }).catch(() => setProducts([]));
  }, []);

  if (products !== null && products.length === 0) return null;

  return (
    <section className="py-4">
      <Reveal as="h2" variant="fade" className="mb-3 px-4 text-xl font-bold">{t("home.featured")}</Reveal>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4">
        {products === null
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-40 shrink-0 rounded-2xl sm:w-48" />)
          : products.map((p, i) => (
            <Reveal key={p.id} delay={i * 70} className="w-40 shrink-0 snap-start sm:w-48">
              <ProductCard product={p} />
            </Reveal>
          ))}
      </div>
    </section>
  );
}
