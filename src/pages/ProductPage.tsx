import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { formatMzn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BoxIcon, ChevronLeftIcon, MinusIcon, PlusIcon } from "@/components/icons";

export default function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null | "not-found">(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.products.get(id).then(setProduct).catch((err) => {
      if (err instanceof ApiError && err.status === 404) setProduct("not-found");
      else setProduct("not-found");
    });
  }, [id]);

  return (
    <main className="pb-10">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeftIcon width={16} height={16} />{t("common.back")}
        </button>

        {product === null && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
          </div>
        )}

        {product === "not-found" && <EmptyState title={t("common.error")} icon={<BoxIcon width={26} height={26} />} />}

        {product && product !== "not-found" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-elevated">
                {product.images[activeImage] ? (
                  <img src={product.images[activeImage].url} alt={product.images[activeImage].altText ?? product.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={40} height={40} /></div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {product.images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImage(i)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border ${i === activeImage ? "border-primary" : "border-border"}`}>
                      <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-xl font-bold">{product.name}</h1>
              <p className="text-2xl font-extrabold text-primary">{formatMzn(product.priceMzn)}</p>
              <p className="text-sm text-ink-muted">
                {product.stock > 0 ? `${product.stock} ${t("product.stock")}` : t("product.outOfStock")}
              </p>
              {product.description && <p className="whitespace-pre-line text-sm text-ink-muted">{product.description}</p>}

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-border">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5 text-ink-muted hover:text-ink"><MinusIcon width={16} height={16} /></button>
                  <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="p-2.5 text-ink-muted hover:text-ink"><PlusIcon width={16} height={16} /></button>
                </div>
                <Button className="flex-1" disabled={product.stock <= 0} onClick={() => addItem(product, quantity)}>
                  {t("product.addToCart")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
