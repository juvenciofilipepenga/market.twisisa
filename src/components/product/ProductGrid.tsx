import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "../ui/Skeleton";
import { Reveal } from "../ui/Reveal";

export function ProductGrid({ products, loading }: { products: Product[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] w-full" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 70} className="h-full">
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}
