import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api, ApiError } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { CsvError, parseProductsCsv, templateCsv, type ImportRow } from "@/lib/productCsv";
import { computePricing } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { adminError } from "@/lib/errors";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useToast } from "@/components/ui/Toast";
import {
  BoxIcon,
  MinusIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@/components/icons";

const PAGE_SIZE = 20;
const LOW_STOCK = 5;

type ImportFailure = { row: number; error: string; detail?: string };
type ImportResult = { created: number; failed: ImportFailure[]; createdAttributes: string[] };

// Texto claro para um erro de leitura do ficheiro, sempre com a linha onde está o problema (nunca "CSV_ROW_PRICE:2").
function csvProblem(e: unknown, t: (key: string) => string): string {
  if (!(e instanceof CsvError)) return t("admin.import.csv.CSV_INVALID");
  const key = `admin.import.csv.${e.code}`;
  const text = t(key);
  const base = text === key ? t("admin.import.csv.CSV_INVALID") : text;
  const detail = e.detail ? ` (${e.detail})` : "";
  return e.line ? `${t("admin.import.line")} ${e.line}: ${base}${detail}` : `${base}${detail}`;
}

// Uma linha que o servidor recusou: a linha do ficheiro e o motivo em palavras.
function failureText(f: ImportFailure, t: (key: string) => string): string {
  const key = `admin.import.err.${f.error}`;
  const text = t(key);
  const base = text === key ? t("admin.import.err.IMPORT_FAILED") : text;
  return `${t("admin.import.line")} ${f.row}: ${base}${f.detail ? ` (${f.detail})` : ""}`;
}

function downloadTemplate() {
  // O BOM faz o Excel abrir o ficheiro em UTF-8 (sem ele, "Memória" aparece estragado).
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + templateCsv()], { type: "text/csv;charset=utf-8" }));
  a.download = "twisisa-produtos-template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { t } = useLocale();

  const [products, setProducts] =
    useState<Product[] | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [total, setTotal] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [filter, setFilter] =
    useState("");

  const [editing, setEditing] =
    useState<Product | null | "new">(
      null
    );

  const [deleting, setDeleting] =
    useState<Product | null>(null);

  const toast = useToast();
  // Erro do pedido de eliminar (visível DENTRO do diálogo) e caso especial: produto já encomendado.
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const [importing, setImporting] =
    useState(false);

  const [importRows, setImportRows] =
    useState<ImportRow[] | null>(null);

  const [importError, setImportError] =
    useState<string | null>(null);

  const [importResult, setImportResult] =
    useState<ImportResult | null>(null);

  const [savingImport, setSavingImport] =
    useState(false);

  const fileRef =
    useRef<HTMLInputElement>(null);

  async function reload() {
    if (!token) return;

    setProducts(null);

    try {
      const r =
        await api.admin.products.list(
          token,
          {
            page,
            limit: PAGE_SIZE,
            search: filter.trim() || undefined
          }
        );

      setProducts(r.data);
      setTotal(r.pagination.total);
    } catch {
      setProducts([]);
    }
  }

  // Pesquisa feita no servidor (antes só filtrava os 20 produtos da página atual).
  useEffect(() => {
    const timeout = setTimeout(() => { void reload(); }, 250);
    return () => clearTimeout(timeout);
  }, [token, page, filter]);

  useEffect(() => {
    api.categories
      .list()
      .then(setCategories)
      .catch(() =>
        setCategories([])
      );
  }, []);

  async function adjustStock(
    product: Product,
    delta: number
  ) {
    if (!token) return;

    try {
      const updated =
        await api.admin.products.adjustStock(
          token,
          product.id,
          delta
        );

      setProducts((current) =>
        current?.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...updated
              }
            : item
        ) ?? null
      );
    } catch (e) {
      toast.show(adminError(e, t), { tone: "error", key: "stock-error" });
    }
  }

  async function toggleActive(product: Product) {
    if (!token) return;
    try {
      const updated = await api.admin.products.update(token, product.id, { active: !product.active });
      setProducts((current) => current?.map((item) => (item.id === product.id ? { ...item, ...updated } : item)) ?? null);
      toast.show(t(updated.active ? "admin.products.activated" : "admin.products.deactivated"), { tone: "success", key: "product-toggle" });
    } catch (e) {
      toast.show(adminError(e, t), { tone: "error", key: "product-toggle" });
    }
  }

  function closeDelete() {
    setDeleting(null);
    setDeleteError(null);
    setDeleteBlocked(false);
  }

  async function removeProduct() {
    if (!token || !deleting) return;
    setDeleteError(null);
    try {
      await api.admin.products.remove(token, deleting.id);
      closeDelete();
      toast.show(t("admin.products.deleted"), { key: "product-delete" });
      await reload();
    } catch (e) {
      // Produto já encomendado: o backend recusa (409) para manter o histórico das encomendas. Em vez de um erro
      // seco, o diálogo explica e oferece a saída certa: desactivar.
      if (e instanceof ApiError && e.code === "PRODUCT_HAS_ORDERS") setDeleteBlocked(true);
      else setDeleteError(adminError(e, t));
    }
  }

  async function deactivateProduct() {
    if (!token || !deleting) return;
    setDeleteError(null);
    try {
      await api.admin.products.update(token, deleting.id, { active: false });
      closeDelete();
      toast.show(t("admin.products.deactivated"), { key: "product-delete" });
      await reload();
    } catch (e) {
      setDeleteError(adminError(e, t));
    }
  }

  async function onFile(file: File) {
    setImportError(null);
    setImportResult(null);

    try {
      const rows = parseProductsCsv(
        await file.text()
      );

      setImportRows(rows);
      setImporting(true);
    } catch (e) {
      setImportRows(null);

      setImportError(csvProblem(e, t));
    }
  }

  async function runImport() {
    if (!token || !importRows) {
      return;
    }

    setSavingImport(true);

    try {
      const r =
        await api.admin.products.bulkCreate(
          token,
          importRows
        );

      const createdAttributes = r.createdAttributes ?? [];

      if (r.failed.length || createdAttributes.length) {
        // Mostra o resultado: o que entrou, as características novas e, linha a linha, o que ficou de fora e porquê.
        setImportResult({ created: r.created, failed: r.failed, createdAttributes });
        setImportRows(null);
      } else {
        setImporting(false);
        setImportRows(null);
        toast.show(`${r.created} ${t("admin.import.created")}`, { tone: "success", key: "product-import" });
      }

      await reload();
    } catch (e) {
      setImportError(adminError(e, t));
    } finally {
      setSavingImport(false);
    }
  }

  const visible = products ?? [];

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const categoryName = (
    id: string | null
  ) =>
    categories.find(
      (category) =>
        category.id === id
    )?.name;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("admin.nav.products")}</h1>
          <p className="mt-1 text-xs text-ink-muted">{total} {t("admin.products.count")}</p>
        </div>
        {/* Uma acção principal à vista; importar e template ficam atrás de "⋯" (usa-se raramente). */}
        <div className="flex items-center gap-1.5">
          <ActionMenu
            label={t("admin.products.more")}
            items={[
              { key: "import", label: t("admin.products.import"), onSelect: () => fileRef.current?.click() },
              { key: "template", label: t("admin.products.template"), onSelect: downloadTemplate }
            ]}
          />
          <Button onClick={() => setEditing("new")}>
            <PlusIcon width={16} height={16} />
            {t("admin.products.new")}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <input
        type="search"
        value={filter}
        onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        placeholder={t("admin.products.search")}
        aria-label={t("admin.products.search")}
        className="mb-4 w-full max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />

      {importError && <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{importError}</p>}

      {products === null && (
        <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      )}

      {products !== null && !visible.length && (
        <EmptyState title={t("catalog.empty")} icon={<BoxIcon width={24} height={24} />} />
      )}

      {products !== null && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((product) => {
            const image = product.images.find((item) => item.isPrimary) ?? product.images[0];
            const hasVariants = Boolean(product.variants?.length);
            return (
              <article key={product.id} className={`rounded-xl border border-border bg-surface p-3 ${product.active ? "" : "opacity-75"}`}>
                <div className="flex items-start gap-2">
                  {/* Tocar na linha abre a edição; as outras acções vivem no menu "⋯". */}
                  <button type="button" onClick={() => setEditing(product)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated">
                      {image ? (
                        <img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={18} height={18} /></span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className="block truncate text-xs text-ink-faint">{categoryName(product.categoryId) ?? "—"}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-primary">{formatMzn(product.priceMzn)}</span>
                        <Badge tone={product.active ? "success" : "neutral"}>{product.active ? t("common.active") : t("common.inactive")}</Badge>
                      </span>
                    </span>
                  </button>
                  <ActionMenu
                    label={`${t("admin.products.menu")}: ${product.name}`}
                    items={[
                      { key: "edit", label: t("common.edit"), onSelect: () => setEditing(product) },
                      { key: "toggle", label: product.active ? t("admin.products.deactivate") : t("admin.products.activate"), onSelect: () => { void toggleActive(product); } },
                      { key: "delete", label: t("admin.products.delete"), danger: true, onSelect: () => setDeleting(product) }
                    ]}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
                  {hasVariants ? (
                    <p className="text-xs font-semibold text-ink-muted">
                      {product.stock} {t("admin.products.inStock")} · {product.variants?.length} {t("admin.products.variants")}
                    </p>
                  ) : (
                    <div role="group" aria-label={t("admin.products.stock")} className="flex items-center rounded-xl border border-border">
                      <button type="button" aria-label={t("admin.products.stockMinus")} disabled={product.stock <= 0} onClick={() => void adjustStock(product, -1)}
                        className="press flex h-10 w-10 items-center justify-center text-ink-muted disabled:opacity-30"><MinusIcon width={16} height={16} /></button>
                      <span aria-live="polite" className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">{product.stock}</span>
                      <button type="button" aria-label={t("admin.products.stockPlus")} onClick={() => void adjustStock(product, 1)}
                        className="press flex h-10 w-10 items-center justify-center text-ink-muted"><PlusIcon width={16} height={16} /></button>
                    </div>
                  )}
                  {product.stock <= 0 ? <Badge tone="danger">{t("admin.products.outOfStock")}</Badge> : product.stock <= LOW_STOCK ? <Badge tone="warning">{t("admin.products.lowStock")}</Badge> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {products !== null &&
        totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                setPage((current) =>
                  current - 1
                )
              }
              disabled={page <= 1}
            >
              <ChevronLeftIcon
                width={16}
                height={16}
              />
            </Button>

            <span className="text-sm text-ink-muted">
              {page} / {totalPages}
            </span>

            <Button
              variant="secondary"
              onClick={() =>
                setPage((current) =>
                  current + 1
                )
              }
              disabled={
                page >= totalPages
              }
            >
              <ChevronRightIcon
                width={16}
                height={16}
              />
            </Button>
          </div>
        )}

      {editing !== null && (
        <ProductFormModal
          product={
            editing === "new"
              ? null
              : editing
          }
          categories={categories}
          onClose={() =>
            setEditing(null)
          }
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}

      {deleting && (
        <Modal title={deleting.name} onClose={closeDelete}>
          <p className="text-sm text-ink-muted">
            {deleteBlocked ? t("admin.products.deleteBlocked") : t("admin.products.deleteConfirm")}
          </p>
          {deleteError && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{deleteError}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={closeDelete}>{t("common.cancel")}</Button>
            {deleteBlocked ? (
              <Button className="flex-1" onClick={deactivateProduct}>{t("admin.products.deactivate")}</Button>
            ) : (
              <Button variant="danger" className="flex-1" onClick={removeProduct}>{t("admin.products.delete")}</Button>
            )}
          </div>
        </Modal>
      )}

      {importing && (importRows || importResult) && (
        <Modal
          title="Pré-visualização CSV"
          onClose={() => {
            if (savingImport) return;
            setImporting(false);
            setImportResult(null);
          }}
        >
          {importResult ? (
            <>
              <p className="text-sm text-ink-muted">
                {importResult.created} {t("admin.import.created")}
              </p>

              {importResult.createdAttributes.length > 0 && (
                <p className="mt-2 text-xs text-ink-muted">
                  {t("admin.import.newAttrs")}: {importResult.createdAttributes.join(", ")}
                </p>
              )}

              {importResult.failed.length > 0 && (
                <>
                  <p className="mt-3 text-sm font-semibold text-danger">
                    {importResult.failed.length} {t("admin.import.failedTitle")}
                  </p>
                  <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-border">
                    {importResult.failed.map((failure, index) => (
                      <div key={index} className="border-b border-border px-3 py-2 text-xs last:border-0">
                        {failureText(failure, t)}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setImporting(false);
                    setImportResult(null);
                  }}
                >
                  {t("admin.import.close")}
                </Button>
              </div>
            </>
          ) : (
            importRows && (
              <>
                <p className="text-sm text-ink-muted">
                  {importRows.length} linhas prontas
                  para validação do servidor.
                </p>

                <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-border">
                  {importRows
                    .slice(0, 50)
                    .map((row, index) => (
                      <div
                        key={index}
                        className="border-b border-border px-3 py-2 text-xs last:border-0"
                      >
                        <strong>
                          {row.line}.
                        </strong>{" "}
                        {row.name} ·{" "}
                        {row.pricing ? computePricing(row.pricing).customerPrice : row.priceMzn} MZN{row.pricing ? " (calculado)" : ""} · stock{" "}
                        {row.stock}
                        {row.attributes?.length ? ` · ${row.attributes.length} ${t("admin.import.attrs")}` : ""}
                      </div>
                    ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      setImporting(false)
                    }
                    disabled={savingImport}
                  >
                    Cancelar
                  </Button>

                  <Button
                    className="flex-1"
                    onClick={() =>
                      void runImport()
                    }
                    loading={savingImport}
                  >
                    Importar
                  </Button>
                </div>
              </>
            )
          )}
        </Modal>
      )}
    </div>
  );
}
