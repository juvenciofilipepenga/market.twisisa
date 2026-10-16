import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { CategoryChips } from "@/components/layout/CategoryChips";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useCategories } from "@/lib/useCategories";
import { useLocale } from "@/i18n/LocaleContext";
import { SITE_URL } from "@/config/site";
import { breadcrumbJsonLd, categoryMeta, categoryPath, collectionJsonLd } from "../../seo/seo.js";
import type { Product } from "@/lib/types";

const PAGE_SIZE = 12;
type State = { kind: "loading" } | { kind: "not-found" } | { kind: "error" } | { kind: "ready"; products: Product[]; total: number };

// Página de categoria com URL própria e indexável (/categoria/:slug): H1, texto, ligações para os produtos e breadcrumbs.
export default function CategoryPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { t } = useLocale();
  const categories = useCategories();
  const category = categories?.find((c) => c.slug === slug) ?? null;
  const [state, setState] = useState<State>({ kind: "loading" });
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { setPage(1); }, [slug]);

  useEffect(() => {
    if (categories === null) return;
    if (!category) { setState({ kind: "not-found" }); return; }
    let cancelled = false;
    setState({ kind: "loading" });
    api.products.list({ categoryId: category.id, page, limit: PAGE_SIZE })
      .then((res) => { if (!cancelled) setState({ kind: "ready", products: res.data, total: res.pagination.total }); })
      .catch(() => { if (!cancelled) setState({ kind: "error" }); });
    return () => { cancelled = true; };
  }, [categories, category, page, attempt]);

  const ready = state.kind === "ready" ? state : null;
  const meta = category && ready ? categoryMeta(category, { total: ready.total, sampleNames: ready.products.map((p) => p.name) }) : null;
  const trail = category ? [{ name: t("nav.home"), path: "/" }, { name: category.name, path: categoryPath(category) }] : [];

  useDocumentMeta({
    title: meta?.title ?? `${t("seo.notFound")} · Twisisa Market`,
    description: meta?.description,
    noindex: !meta || meta.noindex || page > 1,
    jsonLd: category && ready ? [breadcrumbJsonLd(trail, SITE_URL), collectionJsonLd(category, ready.products, SITE_URL)] : null
  });

  const totalPages = ready ? Math.max(1, Math.ceil(ready.total / PAGE_SIZE)) : 1;

  return (
    <main className="pb-6">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-4">
        {state.kind === "not-found" ? (
          <EmptyState image={img.mascotConfused} title={t("notFound.title")} description={t("notFound.body")} action={<Link to="/"><Button variant="secondary">{t("notFound.cta")}</Button></Link>} />
        ) : (
          <>
            <Breadcrumbs trail={[{ name: t("nav.home"), to: "/" }]} current={category?.name ?? "…"} />
            <h1 className="text-2xl font-extrabold md:text-4xl">{category?.name ?? "…"}</h1>
            {ready && <p className="mt-2 max-w-2xl text-sm text-ink-muted md:text-base">{meta?.description}</p>}
            <div className="-mx-4 mt-2"><CategoryChips /></div>
            {state.kind === "error" ? (
              <EmptyState image={img.mascotConfused} title={t("common.error")} action={<Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>{t("common.retry")}</Button>} />
            ) : ready && ready.products.length === 0 ? (
              <EmptyState image={img.mascotConfused} title={t("catalog.emptyFiltered")} action={<Link to="/"><Button variant="secondary">{t("catalog.showAll")}</Button></Link>} />
            ) : (
              <ProductGrid products={ready?.products ?? []} loading={state.kind === "loading"} />
            )}
            {ready && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button variant="secondary" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label={t("common.previous")}>‹</Button>
                <span className="text-sm text-ink-muted">{page} / {totalPages}</span>
                <Button variant="secondary" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label={t("common.next")}>›</Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
