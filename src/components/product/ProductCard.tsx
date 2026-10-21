import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { flyToCart } from "@/lib/fx";
import { formatMzn } from "@/lib/format";
import { cardFacts, priceInfo } from "@/lib/productFacts";
import type { Product } from "@/lib/types";
import { useToast } from "../ui/Toast";
import { CartIcon, BoxIcon, CheckIcon, ArrowRightIcon } from "../icons";
import { responsiveImage } from "../../lib/cloudinary";

const LOW_STOCK = 5;

export function ProductCard({ product }: { product: Product }) {
  const { t } = useLocale();
  const { addItem, items } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [added, setAdded] = useState(false);
  const imageBox = useRef<HTMLAnchorElement>(null);

  const image =
    product.images.find((i) => i.isPrimary) ?? product.images[0];

  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= LOW_STOCK;

  // Com variantes, o utilizador escolhe a opção na página do produto.
  const hasVariants = Boolean(product.variants?.length);

  const facts = cardFacts(product, t("product.yes"), t("product.no"));
  const price = priceInfo(product);

  useEffect(() => {
    if (!added) return;

    const id = setTimeout(() => setAdded(false), 1200);

    return () => clearTimeout(id);
  }, [added]);

  function onAdd() {
    if (hasVariants) {
      navigate(`/produto/${product.id}`);
      return;
    }

    const inCart = Math.min(
      product.stock,
      (items.find(
        (i) => i.productId === product.id && !i.variantId
      )?.quantity ?? 0) + 1
    );

    addItem(product);
    setAdded(true);

    flyToCart(imageBox.current, image?.url ?? null);

    toast.show(
      inCart > 1
        ? `${product.name} · ${inCart} ${t("toast.inCart")}`
        : t("toast.addedAsk"),
      {
        key: `cart:${product.id}`,
        action: {
          label: t("cart.view"),
          onClick: () => navigate("/carrinho"),
        },
      }
    );
  }

  const hasFacts =
    facts.specs.length > 0 ||
    facts.colors.length > 0 ||
    facts.option !== null;

  const label = hasVariants
    ? `${t("product.pickOptions")}: ${product.name}`
    : `${t("product.addToCart")}: ${product.name}`;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-ink-faint focus-within:border-ink-faint">

      {/* Imagem do produto: sem padding e preenchendo toda a área */}
      <Link
        ref={imageBox}
        to={`/produto/${product.id}`}
        className="relative block aspect-square w-full shrink-0 overflow-hidden bg-elevated p-0"
      >
        {image ? (
          <img
            {...responsiveImage(image.url, "(min-width: 1024px) 18rem, (min-width: 640px) 33vw, 50vw", 320)}
            alt={image.altText ?? product.name}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-500 ease-out motion-reduce:transition-none md:group-hover:scale-[1.04] ${
              outOfStock ? "opacity-50" : ""
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center text-ink-faint">
            <BoxIcon width={32} height={32} />
          </div>
        )}

        {outOfStock && (
          <span className="absolute bottom-2 left-2 rounded-full bg-bg/90 px-2.5 py-1 text-[11px] font-semibold text-ink">
            {t("product.outOfStock")}
          </span>
        )}

        {lowStock && (
          <span className="absolute bottom-2 left-2 rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-bg">
            {t("product.lowStock")}
          </span>
        )}
      </Link>

      {/* Informações do produto */}
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <Link
          to={`/produto/${product.id}`}
          className="line-clamp-2 min-h-[2.35rem] break-words text-[13px] font-semibold leading-snug text-ink sm:text-sm"
        >
          {product.name}
        </Link>

        {hasFacts && (
          <div className="space-y-1 text-[11px] leading-snug text-ink-muted">
            {facts.specs.length > 0 && (
              <p className="line-clamp-2">
                {facts.specs.join(" · ")}
              </p>
            )}

            {(facts.colors.length > 0 || facts.option) && (
              <div className="flex min-w-0 items-center gap-2">
                {facts.colors.length > 0 && (
                  <span
                    className="flex shrink-0 items-center"
                    role="img"
                    aria-label={`${
                      facts.colors.length + facts.moreColors
                    } ${t("card.colors")}`}
                  >
                    {facts.colors.map((hex) => (
                      <span
                        key={hex}
                        aria-hidden="true"
                        className="-ml-1 h-3.5 w-3.5 rounded-full border border-surface ring-1 ring-white/20 first:ml-0"
                        style={{ backgroundColor: hex }}
                      />
                    ))}

                    {facts.moreColors > 0 && (
                      <span className="ml-1 font-semibold">
                        +{facts.moreColors}
                      </span>
                    )}
                  </span>
                )}

                {facts.option && (
                  <span className="min-w-0 truncate">
                    {facts.option.name}:{" "}
                    {facts.option.values.join(" · ")}
                    {facts.option.more > 0
                      ? ` +${facts.option.more}`
                      : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preço e botão de ação */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            {price.from && (
              <p className="text-[11px] leading-none text-ink-muted">
                {t("product.from")}
              </p>
            )}

            <p className="whitespace-nowrap font-display text-[clamp(0.72rem,3.2vw,1rem)] font-extrabold leading-tight tracking-tight sm:text-base">
              {formatMzn(price.amount)}
            </p>
          </div>

          <button
            onClick={onAdd}
            disabled={outOfStock}
            aria-label={label}
            className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-elevated disabled:text-ink-faint sm:h-10 sm:w-10 ${
              added
                ? "bg-success text-bg"
                : hasVariants
                  ? "border border-border bg-elevated text-ink hover:border-ink-faint"
                  : "bg-primary text-white hover:bg-primary-hover active:bg-primary-active"
            }`}
          >
            {added ? (
              <CheckIcon className="pop" width={18} height={18} />
            ) : hasVariants ? (
              <ArrowRightIcon width={18} height={18} />
            ) : (
              <CartIcon width={18} height={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
