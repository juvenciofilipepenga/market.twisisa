import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { formatMzn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { CartIcon, BoxIcon } from "../icons";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useLocale();
  const { addItem } = useCart();
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const outOfStock = product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <Link to={`/produto/${product.id}`} className="relative block aspect-square w-full bg-elevated">
        {image ? (
          <img src={image.url} alt={image.altText ?? product.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={32} height={32} /></div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {t("product.outOfStock")}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link to={`/produto/${product.id}`} className="line-clamp-2 text-sm font-medium text-ink">{product.name}</Link>
        <p className="text-base font-bold text-primary">{formatMzn(product.priceMzn)}</p>
        <button
          onClick={() => addItem(product)}
          disabled={outOfStock}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-elevated py-2 text-xs font-semibold text-ink transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-elevated disabled:hover:text-ink"
        >
          <CartIcon width={15} height={15} />
          {t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
