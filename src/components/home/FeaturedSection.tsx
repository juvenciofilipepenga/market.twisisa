import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import type { Product } from "@/lib/types";
import { ProductCard } from "../product/ProductCard";
import { Skeleton } from "../ui/Skeleton";

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
    <section className="px-4 py-4">
      <h2 className="mb-3 text-lg font-bold">{t("home.featured")}</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
        {products === null
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 w-36 shrink-0" />)
          : products.map((p) => (
            <div key={p.id} className="w-36 shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
      </div>
    </section>
  );
}
