import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { BoxIcon, MinusIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Product | null | "new">(null);

  function reload() {
    if (!token) return;
    setProducts(null);
    api.admin.products.list(token, { page, limit: PAGE_SIZE }).then((r) => { setProducts(r.data); setTotal(r.pagination.total); });
  }

  useEffect(reload, [token, page]);
  useEffect(() => { api.categories.list().then(setCategories).catch(() => setCategories([])); }, []);

  async function adjustStock(product: Product, delta: number) {
    if (!token) return;
    const updated = await api.admin.products.adjustStock(token, product.id, delta);
    setProducts((prev) => prev?.map((p) => (p.id === product.id ? updated : p)) ?? null);
  }

  const visible = products?.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase())) ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t("admin.nav.products")}</h1>
        <Button onClick={() => setEditing("new")}><PlusIcon width={16} height={16} />{t("admin.products.new")}</Button>
      </div>

      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("admin.products.search")}
        className="mb-4 w-full max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" />

      {products === null && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}

      {products !== null && visible.length === 0 && <EmptyState title={t("catalog.empty")} icon={<BoxIcon width={24} height={24} />} />}

      {products !== null && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((product) => {
            const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
            return (
              <div key={product.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated">
                  {image ? <img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
                    <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={18} height={18} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-ink-faint">{categoryName(product.categoryId) ?? "—"}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{formatMzn(product.priceMzn)}</span>
                    <Badge tone={product.active ? "success" : "neutral"}>{product.active ? t("common.active") : t("common.inactive")}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border">
                  <button onClick={() => adjustStock(product, -1)} disabled={product.stock <= 0} className="p-1.5 text-ink-muted hover:text-ink disabled:opacity-30">
                    <MinusIcon width={14} height={14} />
                  </button>
                  <span className="w-8 text-center text-xs font-semibold">{product.stock}</span>
                  <button onClick={() => adjustStock(product, 1)} className="p-1.5 text-ink-muted hover:text-ink">
                    <PlusIcon width={14} height={14} />
                  </button>
                </div>
                <Button variant="secondary" onClick={() => setEditing(product)}>{t("common.edit")}</Button>
              </div>
            );
          })}
        </div>
      )}

      {products !== null && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}><ChevronLeftIcon width={16} height={16} /></Button>
          <span className="text-sm text-ink-muted">{page} / {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}><ChevronRightIcon width={16} height={16} /></Button>
        </div>
      )}

      {editing !== null && (
        <ProductFormModal
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setProducts((prev) => {
              if (!prev) return prev;
              const exists = prev.some((p) => p.id === saved.id);
              return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
            });
            setEditing(editing === "new" ? null : saved);
          }}
        />
      )}
    </div>
  );
}
