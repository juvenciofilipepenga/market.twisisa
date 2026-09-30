import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import type { Product } from "@/lib/types";
import { ProductGrid } from "../product/ProductGrid";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "../icons";

const PAGE_SIZE = 12;

export function CatalogSection() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError(false);
    api.products.list({ search, categoryId, page, limit: PAGE_SIZE })
      .then((res) => { if (!cancelled) { setProducts(res.data); setTotal(res.pagination.total); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [search, categoryId, page, attempt]);

  function goToPage(next: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(next));
    navigate(`/?${params.toString()}`);
    document.getElementById("catalogo")?.scrollIntoView({ block: "start" });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(search || categoryId);

  return (
    <section id="catalogo" className="scroll-mt-32 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="text-xl font-bold">{t("home.catalog")}</h2>
          {products !== null && total > 0 && <p className="shrink-0 text-xs text-ink-faint">{total} {t("catalog.count")}</p>}
        </div>
        {filtered && (
          <button onClick={() => navigate("/")} className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-ink-muted hover:text-ink">
            <XIcon width={14} height={14} />{t("catalog.clear")}
          </button>
        )}
      </div>
      {search && <p className="mb-3 text-sm text-ink-muted">{t("catalog.resultsFor")} <strong className="text-ink">“{search}”</strong></p>}

      {error ? (
        <EmptyState image={img.mascotConfused} title={t("common.error")} action={<Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>{t("common.retry")}</Button>} />
      ) : products !== null && products.length === 0 ? (
        <EmptyState
          image={img.mascotConfused}
          title={t("catalog.empty")}
          description={t("catalog.emptyHint")}
          action={filtered ? <Button variant="secondary" onClick={() => navigate("/")}>{t("catalog.clear")}</Button> : undefined}
        />
      ) : (
        <>
          <ProductGrid products={products ?? []} loading={products === null} />
          {products !== null && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="secondary" size="icon" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label={t("common.previous")}>
                <ChevronLeftIcon width={16} height={16} />
              </Button>
              <span className="text-sm text-ink-muted">{page} / {totalPages}</span>
              <Button variant="secondary" size="icon" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} aria-label={t("common.next")}>
                <ChevronRightIcon width={16} height={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
