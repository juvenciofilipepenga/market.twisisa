import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useFeaturedProducts } from "@/lib/useFeaturedProducts";
import { formatMzn } from "@/lib/format";
import { img } from "@/lib/images";
import type { Product } from "@/lib/types";
import { SpeedLines } from "../brand/SpeedLines";
import { Button, buttonClass } from "../ui/Button";
import { responsiveImage } from "../../lib/cloudinary";
import {
  ArrowRightIcon,
  BoxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparkIcon,
} from "../icons";

const LOW_STOCK = 5;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Hero() {
  const { t } = useLocale();
  const { ready, hero } = useFeaturedProducts();

  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const raf = useRef(0);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = hero.length;

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;

      if (!el || count === 0) return;

      const next = (i + count) % count;
      const far = Math.abs(next - indexRef.current) > 1;

      indexRef.current = next;
      setIndex(next);

      el.scrollTo({
        left: next * el.clientWidth,
        behavior: reducedMotion() || far ? "auto" : "smooth",
      });
    },
    [count]
  );

  function onScroll() {
    if (raf.current) return;

    raf.current = requestAnimationFrame(() => {
      raf.current = 0;

      const el = trackRef.current;
      if (!el) return;

      const i = Math.round(el.scrollLeft / (el.clientWidth || 1));

      indexRef.current = i;
      setIndex(i);
    });
  }

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || count < 2 || paused || reducedMotion()) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        goTo(indexRef.current + 1);
      }
    }, 4800);

    return () => window.clearInterval(timer);
  }, [count, goTo, paused, ready]);

  function goToCatalog() {
    document.getElementById("catalogo")?.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  const hasSlides = ready && count > 0;

  return (
    <section
      className="px-4 pt-2"
      aria-roledescription={hasSlides ? "carousel" : undefined}
      aria-label={t("home.new")}
    >
      <h1 className="sr-only">{t("hero.title")}</h1>

      <div
        className="hero-card relative overflow-hidden rounded-3xl bg-primary-active"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <SpeedLines className="pointer-events-none absolute -left-8 top-5 h-28 w-44 text-white/15 md:left-4 md:h-40 md:w-64" />

        {hasSlides ? (
          <>
            <div
              ref={trackRef}
              onScroll={onScroll}
              aria-live="polite"
              className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
            >
              {hero.map((p, i) => (
                <ProductSlide
                  key={p.id}
                  product={p}
                  index={i}
                  total={count}
                />
              ))}
            </div>

            {count > 1 && (
              <div className="absolute inset-x-0 bottom-3 flex items-center justify-between px-5 md:bottom-5 md:px-10">
                <div className="flex items-center gap-1">
                  {hero.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={`${i + 1} / ${count}`}
                      aria-current={i === index ? "true" : undefined}
                      onClick={() => goTo(i)}
                      className="flex h-6 items-center px-1"
                    >
                      <span
                        className={`block h-1.5 rounded-full bg-white transition-all duration-300 ${
                          i === index
                            ? "w-6 opacity-100"
                            : "w-1.5 opacity-40"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goTo(index - 1)}
                    aria-label={t("common.previous")}
                    className="press hidden h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10 md:flex"
                  >
                    <ChevronLeftIcon width={16} height={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo(index + 1)}
                    aria-label={t("common.next")}
                    className="press hidden h-8 w-8 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10 md:flex"
                  >
                    <ChevronRightIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="relative grid min-h-[16rem] grid-cols-[1fr_auto] items-end gap-2 pl-5 pt-8 md:min-h-[23rem] md:pl-10 md:pt-12">
            <div className="pb-6 md:pb-10">
              {ready ? (
                <>
                  <p className="max-w-md text-[1.75rem] font-extrabold leading-[1.08] text-white md:text-5xl">
                    {t("hero.title")}
                  </p>

                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-white md:text-base">
                    {t("hero.body")}
                  </p>

                  <div className="mt-5">
                    <Button
                      variant="light"
                      size="lg"
                      onClick={goToCatalog}
                    >
                      {t("hero.cta")}
                      <ArrowRightIcon width={18} height={18} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3" aria-hidden="true">
                  <div className="h-6 w-24 animate-pulse rounded-lg bg-white/15" />
                  <div className="h-9 w-56 animate-pulse rounded-lg bg-white/15" />
                  <div className="h-9 w-32 animate-pulse rounded-lg bg-white/15" />
                </div>
              )}
            </div>

            {ready && (
              <img
                src={img.mascotDelivery}
                alt=""
                width={900}
                height={1106}
                className="h-36 w-36 object-contain object-bottom sm:h-48 sm:w-48 md:h-72 md:w-72"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ProductSlide({
  product: p,
  index,
  total,
}: {
  product: Product;
  index: number;
  total: number;
}) {
  const { t } = useLocale();

  const image = p.images.find((i) => i.isPrimary) ?? p.images[0];

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${total}`}
      className="hero-slide relative w-full shrink-0 snap-center"
    >
      <div className="grid min-h-[16rem] grid-cols-[1fr_auto] items-center gap-3 pb-12 pl-5 pr-4 pt-6 md:min-h-[23rem] md:gap-8 md:pb-14 md:pl-10 md:pr-12 md:pt-10">
        <div className="hero-copy relative z-10 min-w-0">
          {/* Etiqueta com borda animada em gradiente */}
          <span className="hero-new-badge relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white">
            <SparkIcon width={14} height={14} />
            <span>{t("home.new")}</span>
          </span>

          <h2 className="mt-3 line-clamp-2 max-w-md text-xl font-extrabold leading-tight text-white md:text-4xl">
            {p.name}
          </h2>

          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-white md:text-3xl">
            {formatMzn(p.priceMzn)}
          </p>

          {p.stock <= LOW_STOCK && (
            <p className="mt-1 text-xs font-semibold text-sun">
              {t("product.lowStock")}
            </p>
          )}

          <Link
            to={`/produto/${p.id}`}
            className={buttonClass("light", "lg", "mt-4")}
          >
            {t("hero.viewProduct")}
            <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>

        {/* Imagem totalmente preenchida, sem padding */}
        <Link
          to={`/produto/${p.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="hero-product-art relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30 sm:h-44 sm:w-44 md:h-72 md:w-72"
        >
          {image ? (
            <img
              {...responsiveImage(image.url, "(min-width: 768px) 18rem, (min-width: 640px) 11rem, 9rem", 288)}
              alt=""
              width={288}
              height={288}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : undefined}
              className="absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-500 ease-out motion-reduce:transition-none md:group-hover:scale-[1.04]"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-ink-faint">
              <BoxIcon width={40} height={40} />
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
