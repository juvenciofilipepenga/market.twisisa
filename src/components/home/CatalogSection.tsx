import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import { loadError } from "@/lib/errors";
import type { Product } from "@/lib/types";
import { ProductGrid } from "../product/ProductGrid";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "../icons";

const PREVIEW_SIZE = 4;
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
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const filtered = Boolean(search || categoryId);
  const limit = filtered || showAll ? PAGE_SIZE : PREVIEW_SIZE;

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setError(null);
    api.products.list({ search, categoryId, page, limit })
      .then((res) => { if (!cancelled) { setProducts(res.data); setTotal(res.pagination.total); } })
      .catch((err: unknown) => { if (!cancelled) setError(err ?? new Error("load")); });
    return () => { cancelled = true; };
  }, [search, categoryId, page, attempt, limit]);

  function goToPage(next: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(next));
    navigate(`/?${params.toString()}`);
    document.getElementById("catalogo")?.scrollIntoView({ block: "start" });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section id="catalogo" className="scroll-mt-32 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Sem filtros o catálogo é a lista do que a loja tem, do mais recente para o mais antigo: o convite é a descobrir. */}
          {!filtered && <img src={img.news} alt="" width={256} height={256} loading="lazy" className="h-9 w-9 shrink-0 object-contain" />}
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 className="text-xl font-bold">{filtered ? t("home.catalog") : t("home.discover")}</h2>
            {/* Mesmo sítio para as duas mensagens: o contador substitui o "a procurar" sem mexer no resto da página. */}
            <p role="status" className="shrink-0 text-xs text-ink-faint">
              {products === null && !error ? t("catalog.loading") : products !== null && total > 0 ? `${total} ${t("catalog.count")}` : ""}
            </p>
          </div>
        </div>
        {filtered && (
          <button onClick={() => navigate("/")} className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-ink-muted hover:text-ink">
            <XIcon width={14} height={14} />{t("catalog.clear")}
          </button>
        )}
      </div>
      {search && <p className="mb-3 text-sm text-ink-muted">{t("catalog.resultsFor")} <strong className="text-ink">“{search}”</strong></p>}

      {error ? (
        <EmptyState image={img.mascotConfused} title={loadError(error, t)} action={<Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>{t("common.retry")}</Button>} />
      ) : products !== null && products.length === 0 ? (
        filtered ? (
          <EmptyState
            image={img.mascotConfused}
            title={t("catalog.emptyFiltered")}
            description={t("catalog.emptyFilteredHint")}
            action={<Button variant="secondary" onClick={() => navigate("/")}>{t("catalog.showAll")}</Button>}
          />
        ) : (
          <EmptyState image={img.mascotConfused} title={t("catalog.emptyStore")} description={t("catalog.emptyStoreHint")} />
        )
      ) : (
        <>
          <ProductGrid products={products ?? []} loading={products === null} />
          {!filtered && !showAll && products !== null && total > products.length && (
            <div className="mt-5 flex justify-center">
              <Button variant="secondary" onClick={() => navigate("/pesquisa")} className="min-w-44 rounded-full px-6">
                {t("catalog.showAll")} <ChevronRightIcon width={16} height={16} />
              </Button>
            </div>
          )}
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
