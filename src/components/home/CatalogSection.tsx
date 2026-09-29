import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import type { Product } from "@/lib/types";
import { ProductGrid } from "../product/ProductGrid";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "../icons";

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

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError(false);
    api.products.list({ search, categoryId, page, limit: PAGE_SIZE })
      .then((res) => { if (!cancelled) { setProducts(res.data); setTotal(res.pagination.total); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [search, categoryId, page]);

  function goToPage(next: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(next));
    navigate(`/?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section id="catalogo" className="scroll-mt-32 px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{t("home.catalog")}</h2>
        {products !== null && total > 0 && <p className="text-xs text-ink-faint">{total} {t("catalog.count")}</p>}
      </div>
      {error ? (
        <EmptyState title={t("common.error")} icon={<SearchIcon width={26} height={26} />} />
      ) : products !== null && products.length === 0 ? (
        <EmptyState title={t("catalog.empty")} description={search ? `"${search}"` : undefined} icon={<SearchIcon width={26} height={26} />} />
      ) : (
        <>
          <ProductGrid products={products ?? []} loading={products === null} />
          {products !== null && totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <Button variant="secondary" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Anterior">
                <ChevronLeftIcon width={16} height={16} />
              </Button>
              <span className="text-sm text-ink-muted">{page} / {totalPages}</span>
              <Button variant="secondary" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} aria-label="Seguinte">
                <ChevronRightIcon width={16} height={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
