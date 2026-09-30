import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { flyToCart } from "@/lib/fx";
import { formatMzn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useToast } from "../ui/Toast";
import { CartIcon, BoxIcon, CheckIcon } from "../icons";

const LOW_STOCK = 5;

export function ProductCard({ product }: { product: Product }) {
  const { t } = useLocale();
  const { addItem, items } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const imageBox = useRef<HTMLAnchorElement>(null);
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= LOW_STOCK;

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(id);
  }, [added]);

  function onAdd() {
    const inCart = Math.min(product.stock, (items.find((i) => i.productId === product.id)?.quantity ?? 0) + 1);
    addItem(product);
    setAdded(true);
    flyToCart(imageBox.current, image?.url ?? null);
    // Mesma chave por produto: adicionar de novo actualiza o aviso ("· 3 no carrinho") em vez de criar outro.
    toast.show(inCart > 1 ? `${product.name} · ${inCart} ${t("toast.inCart")}` : `${product.name} ${t("toast.added")}`, {
      key: `cart:${product.id}`,
      action: { label: t("cart.view"), onClick: () => navigate("/carrinho") }
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <Link ref={imageBox} to={`/produto/${product.id}`} className="relative block aspect-[4/5] w-full bg-elevated">
        {image ? (
          <img src={image.url} alt={image.altText ?? product.name} loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${outOfStock ? "opacity-50" : ""}`} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={32} height={32} /></div>
        )}
        {outOfStock && <span className="absolute bottom-2 left-2 rounded-full bg-bg/90 px-2.5 py-1 text-[11px] font-semibold text-ink">{t("product.outOfStock")}</span>}
        {lowStock && <span className="absolute bottom-2 left-2 rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-bg">{t("product.lowStock")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/produto/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ink">{product.name}</Link>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="font-display text-base font-bold leading-none">{formatMzn(product.priceMzn)}</p>
          <button
            onClick={onAdd}
            disabled={outOfStock}
            aria-label={`${t("product.addToCart")}: ${product.name}`}
            className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-elevated disabled:text-ink-faint ${added ? "bg-success text-bg" : "bg-primary text-white hover:bg-primary-hover active:bg-primary-active"}`}
          >
            {added ? <CheckIcon className="pop" width={18} height={18} /> : <CartIcon width={18} height={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
