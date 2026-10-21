import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { flyToCart } from "@/lib/fx";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useCategories } from "@/lib/useCategories";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { breadcrumbJsonLd, categoryPath, productJsonLd, productMeta, productPath } from "../../seo/seo.js";
import { deriveOptionDefs, findSelectedVariant } from "@/lib/catalog";
import { Modal } from "@/components/ui/Modal";
import { OptionPicker } from "@/components/product/OptionPicker";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { SITE_URL } from "@/config/site";
import { img } from "@/lib/images";
import { formatMzn } from "@/lib/format";
import type { Product, Review } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast, useBottomBarOffset } from "@/components/ui/Toast";
import { BoxIcon, CheckIcon, ChevronLeftIcon, MinusIcon, PlusIcon, XIcon } from "@/components/icons";
import { cldUrl, responsiveImage } from "@/lib/cloudinary";

const LOW_STOCK = 5;
type State = { kind: "loading" } | { kind: "error" } | { kind: "not-found" } | { kind: "ready"; product: Product };

export default function ProductPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { addItem, items } = useCart();
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  // Opções escolhidas pelo cliente: { Cor: "#000000", Tamanho: "M" }. A variante só existe com a combinação completa.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<{data: Review[]; summary:{average:number;count:number}} | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const gallery = useRef<HTMLDivElement>(null);
  const buyBox = useRef<HTMLDivElement>(null);

  const loaded = state.kind === "ready" ? state.product : null;
  const loadedImage = loaded ? (loaded.images.find((i) => i.isPrimary) ?? loaded.images[0])?.url : undefined;
  const categories = useCategories();
  const category = loaded?.categoryId ? (categories?.find((c) => c.id === loaded.categoryId) ?? null) : null;
  // Mesmo texto que o servidor (api/render.js) escreve no HTML: ver seo/seo.js.
  const meta = loaded ? productMeta(loaded, category) : null;
  const trail = loaded
    ? [{ name: t("nav.home"), path: "/" }, ...(category ? [{ name: category.name, path: categoryPath(category) }] : []), { name: loaded.name, path: productPath(loaded) }]
    : [];
  useDocumentMeta({
    title: meta?.title ?? `${t("nav.home")} · Twisisa Market`,
    description: meta?.description ?? t("seo.home.description"),
    image: loadedImage ?? null,
    noindex: !loaded,
    jsonLd: loaded ? [productJsonLd(loaded, SITE_URL), breadcrumbJsonLd(trail, SITE_URL)] : null
  });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    setActiveImage(0);
    setQuantity(1);
    setSelected({});
    api.products.get(id)
      .then((product) => { if (!cancelled) setState({ kind: "ready", product }); })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: number }).status : 0;
        setState({ kind: status === 404 ? "not-found" : "error" });
      });
    api.reviews.list(id).then((r) => { if (!cancelled) setReviews(r); }).catch(() => { if (!cancelled) setReviews({ data: [], summary: { average: 0, count: 0 } }); });
    return () => { cancelled = true; };
  }, [id, attempt]);

  // Barra de compra fixa (só telemóvel): aparece quando o botão principal sai do ecrã, para comprar sem voltar a subir.
  const ready = state.kind === "ready";
  useEffect(() => {
    const el = buyBox.current;
    if (!el || !ready || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry?.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ready]);
  useBottomBarOffset(barVisible && ready, 84);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(timer);
  }, [added]);

  async function submitReview() {
    const token = localStorage.getItem("twisisa.token");
    if (!token) { setReviewMessage("Entre na sua conta para avaliar depois de uma compra."); return; }
    try {
      await api.reviews.create(id, token, { rating: reviewRating, comment: reviewComment.trim() || undefined });
      setReviews(await api.reviews.list(id)); setReviewComment(""); setReviewOpen(false); toast.show(t("product.review.sent"), { key: "review-sent" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setReviewMessage(message.includes("PURCHASE_REQUIRED")
        ? "Para avaliar este produto, precisa de ter uma compra registada na sua conta."
        : message || "Não foi possível enviar a avaliação. Tente novamente.");
    }
  }

  function goBack() {
    if (window.history.length > 1) navigate(-1); else navigate("/");
  }

  function onGalleryScroll() {
    const el = gallery.current;
    if (el && el.clientWidth) setActiveImage(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goToImage(i: number) {
    const el = gallery.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function onAdd(product: Product) {
    const variants = product.variants ?? [];
    const defs = product.optionDefs ?? deriveOptionDefs(variants);
    const variant = findSelectedVariant(variants, defs, selected);
    if (variants.length > 0 && !variant) {
      const missing = defs.filter((d) => !selected[d.name]).map((d) => d.name).join(", ");
      toast.show(`${t("product.choose")} ${missing || t("product.chooseOptions")}.`, { tone: "info", key: `variant-required:${product.id}` });
      return;
    }
    const available = variant?.stock ?? product.stock;
    const inCart = Math.min(available, (items.find((i) => i.productId === product.id && i.variantId === (variant?.id ?? null))?.quantity ?? 0) + quantity);
    addItem(product, quantity, variant);
    setAdded(true);
    const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
    flyToCart(gallery.current, image?.url ?? null);
    toast.show(inCart > 1 ? `${product.name} · ${inCart} ${t("toast.inCart")}` : `${product.name} ${t("toast.added")}`, {
      key: `cart:${product.id}`,
      action: { label: t("cart.view"), onClick: () => navigate("/carrinho") }
    });
  }

  return (
    <main className="pb-28 md:pb-10">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-4">
        {loaded && <Breadcrumbs trail={[{ name: t("nav.home"), to: "/" }, ...(category ? [{ name: category.name, to: categoryPath(category) }] : [])]} current={loaded.name} />}
        <button onClick={goBack} className="press mb-3 -ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted hover:text-ink">
          <ChevronLeftIcon width={16} height={16} />{t("common.back")}
        </button>

        {state.kind === "loading" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-10 w-1/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
          </div>
        )}

        {state.kind === "not-found" && (
          <EmptyState image={img.mascotConfused} title={t("product.notFound")} action={<Button variant="secondary" onClick={() => navigate("/")}>{t("common.backHome")}</Button>} />
        )}
        {state.kind === "error" && (
          <EmptyState image={img.mascotConfused} title={t("common.error")} action={<Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>{t("common.retry")}</Button>} />
        )}

        {state.kind === "ready" && (() => {
          const product = state.product;
          const variants = product.variants ?? [];
          const defs = product.optionDefs ?? deriveOptionDefs(variants);
          const selectedVariant = findSelectedVariant(variants, defs, selected);
          const availableStock = selectedVariant?.stock ?? product.stock;
          // Preços diferentes entre variantes: antes de escolher mostra "A partir de".
          const priceVaries = !selectedVariant && variants.some((v) => Number(v.effectivePriceMzn ?? product.priceMzn) !== Number(product.priceMzn));
          const shownPrice = selectedVariant?.effectivePriceMzn ?? (priceVaries ? product.priceFromMzn ?? product.priceMzn : product.priceMzn);
          const requiresVariant = variants.length > 0;
          const outOfStock = availableStock <= 0 || (requiresVariant && !selectedVariant);
          const low = !outOfStock && availableStock <= LOW_STOCK;
          return (
            <>
              <div className="grid gap-6 md:grid-cols-2 md:gap-10">
                <div>
                  <div className="relative">
                    <div ref={gallery} onScroll={onGalleryScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-border bg-elevated">
                      {product.images.length === 0 ? (
                        <div className="flex aspect-square w-full shrink-0 items-center justify-center text-ink-faint"><BoxIcon width={40} height={40} /></div>
                      ) : product.images.map((image, i) => (
                        <div key={image.id} className="relative aspect-square w-full shrink-0 snap-center">
                          <img {...responsiveImage(image.url, "(min-width: 768px) 50vw, 100vw", 640)} alt={image.altText ?? product.name} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {product.images.length > 1 && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                        {product.images.map((image, i) => (
                          <span key={image.id} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImage ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="no-scrollbar mt-2 hidden gap-2 overflow-x-auto md:flex">
                      {product.images.map((image, i) => (
                        <button key={image.id} onClick={() => goToImage(i)} aria-label={`${i + 1} / ${product.images.length}`} className={`press relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === activeImage ? "border-primary" : "border-border"}`}>
                          <img src={cldUrl(image.url, 160)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <h1 className="text-2xl font-extrabold leading-tight md:text-3xl">{product.name}</h1>
                  <p className="font-display text-3xl font-extrabold">{priceVaries && <span className="mr-2 text-sm font-semibold text-ink-muted">{t("product.from")}</span>}{formatMzn(shownPrice)}</p>
                  <p className={`flex items-center gap-2 text-sm font-medium ${outOfStock ? "text-danger" : low ? "text-sun" : "text-success"}`}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {requiresVariant && !selectedVariant ? `${t("product.choose")} ${defs.filter((d) => !selected[d.name]).map((d) => d.name).join(", ")}` : outOfStock ? t("product.outOfStock") : `${availableStock} ${t("product.stock")}`}
                  </p>
                  {product.description && <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">{product.description}</p>}
                  {variants.length > 0 && (
                    <OptionPicker defs={defs} variants={variants} selected={selected}
                      onSelect={(name, value) => setSelected((prev) => ({ ...prev, [name]: value }))} onClear={() => setSelected({})} />
                  )}
                  {selectedVariant?.sku && <p className="-mt-2 text-xs text-ink-faint">{t("product.ref")} {selectedVariant.sku}</p>}

                  <div ref={buyBox} className="mt-1 flex items-center gap-3">
                    <div className="flex items-center rounded-xl border border-border" role="group" aria-label={t("product.quantity")}>
                      <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1 || outOfStock} aria-label="-" className="press flex h-12 w-11 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"><MinusIcon width={16} height={16} /></button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                      <button onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))} disabled={quantity >= availableStock || outOfStock} aria-label="+" className="press flex h-12 w-11 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"><PlusIcon width={16} height={16} /></button>
                    </div>
                    <Button size="lg" className="flex-1" disabled={outOfStock} onClick={() => onAdd(product)}>
                      {added ? <><CheckIcon className="pop" width={18} height={18} />{t("product.added")}</> : t("product.addToCart")}
                    </Button>
                  </div>
                </div>
              </div>

              <ProductSpecs attributes={product.attributes ?? []} />

              <section className="mt-8 border-t border-border pt-6">
                <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold">Avaliações</h2><p className="mt-1 text-sm text-ink-muted">{reviews?.summary.count ? `${reviews.summary.average.toFixed(1)}/5 · ${reviews.summary.count} avaliações` : "Ainda sem avaliações"}</p></div></div>
                {reviews?.data.length ? <div className="mt-4 space-y-3">{reviews.data.slice(0,5).map(r=><article key={r.id} className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-center justify-between"><strong className="text-sm">{r.userName}</strong><span className="text-sm font-semibold">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span></div>{r.comment&&<p className="mt-2 text-sm leading-relaxed text-ink-muted">{r.comment}</p>}</article>)}</div>:null}
                <Button variant="secondary" className="mt-4 w-full" onClick={() => { setReviewMessage(null); setReviewOpen(true); }}>{t("product.review.write")}</Button>
                {reviewOpen && (
                  <Modal title={t("product.review.title")} size="sm" onClose={() => setReviewOpen(false)}>
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-border bg-elevated/70 p-4">
                        <p className="text-sm leading-relaxed text-ink-muted">{t("product.review.hint")}</p>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{t("product.review.rating")}</span>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{reviewRating}/5</span>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label={t("product.review.rating")}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" role="radio" aria-checked={n === reviewRating} onClick={() => { setReviewRating(n); setReviewMessage(null); }} className={`press flex aspect-square min-w-0 items-center justify-center rounded-2xl border text-2xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${n <= reviewRating ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-surface text-ink-faint hover:border-primary/50 hover:bg-elevated"}`} aria-label={`${n} ${t("product.review.stars")}`}>
                              <span aria-hidden="true">★</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="product-review-comment" className="mb-2 block text-sm font-semibold">{t("product.review.comment")}</label>
                        <textarea id="product-review-comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} maxLength={1000} placeholder="Conte-nos a sua experiência com este produto…" className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-base leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm" />
                        <p className="mt-1 text-right text-xs text-ink-faint">{reviewComment.length}/1000</p>
                      </div>
                      {reviewMessage && <p role="status" className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm leading-relaxed text-danger">{reviewMessage}</p>}
                      <div className="flex gap-2 border-t border-border pt-4">
                        <Button variant="secondary" className="flex-1 rounded-xl" icon={<XIcon width={17} height={17} />} onClick={() => setReviewOpen(false)}>{t("common.cancel")}</Button>
                        <Button className="flex-1 rounded-xl" icon={<CheckIcon width={17} height={17} />} onClick={async () => { await submitReview(); }}>{t("product.review.send")}</Button>
                      </div>
                    </div>
                  </Modal>
                )}
              </section>


              {/* Barra fixa: telemóvel, só quando o botão principal não está visível */}
              <div className={`bar-above-nav fixed inset-x-0 z-40 border-t border-border bg-bg/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden ${barVisible ? "" : "translate-y-full"}`} aria-hidden={!barVisible}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-ink-muted">{product.name}</p>
                    <p className="font-display text-lg font-extrabold leading-tight">{formatMzn(Number(selectedVariant?.effectivePriceMzn ?? product.priceMzn) * quantity)}</p>
                  </div>
                  <Button size="lg" className="ml-auto shrink-0" disabled={outOfStock} tabIndex={barVisible ? 0 : -1} onClick={() => onAdd(product)}>
                    {added ? <CheckIcon className="pop" width={18} height={18} /> : t("product.addToCart")}
                  </Button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </main>
  );
}
