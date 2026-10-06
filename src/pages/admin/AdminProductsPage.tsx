import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api, ApiError } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
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

type ImportRow = {
  name: string;
  description?: string;
  priceMzn: number;
  stock: number;
  categoryId?: string;
  active: boolean;
  variants?: Array<{
    colorHex?: string;
    size?: string;
    stock: number;
    active: boolean;
  }>;
};

// Divide uma linha CSV respeitando aspas ("Cadeira, azul" é UMA coluna) e "" como aspa literal.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') quoted = false;
      else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(current.trim()); current = ""; }
    else current += ch;
  }
  out.push(current.trim());
  return out;
}

function parseCsv(text: string): ImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV_EMPTY");
  }

  const firstLine = lines[0];

  if (!firstLine) {
    throw new Error("CSV_EMPTY");
  }

  const headers = splitCsvLine(firstLine);

  const required = [
    "name",
    "priceMzn",
    "stock"
  ];

  if (
    required.some(
      (key) => !headers.includes(key)
    )
  ) {
    throw new Error(
      `CSV_HEADERS:${required.join(",")}`
    );
  }

  const rows: ImportRow[] = [];

  for (
    let index = 1;
    index < lines.length;
    index++
  ) {
    const line = lines[index];

    if (!line) continue;

    const values = splitCsvLine(line);

    const row = Object.fromEntries(
      headers.map((header, valueIndex) => [
        header,
        values[valueIndex] ?? ""
      ])
    ) as Record<string, string>;

    const name = row.name?.trim() ?? "";

    if (!name) {
      throw new Error(
        `CSV_ROW_NAME:${index + 1}`
      );
    }

    const priceMzn = Number(
      row.priceMzn
    );

    const stock = Number(row.stock);

    if (!Number.isInteger(stock)) {
      throw new Error(`CSV_ROW_STOCK:${index + 1}`);
    }

    if (
      !Number.isFinite(priceMzn) ||
      priceMzn < 0
    ) {
      throw new Error(
        `CSV_ROW_PRICE:${index + 1}`
      );
    }

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      throw new Error(
        `CSV_ROW_STOCK:${index + 1}`
      );
    }

    const hasVariant =
      Boolean(row.colorHex?.trim()) ||
      Boolean(row.size?.trim());

    rows.push({
      name,
      description:
        row.description?.trim() ||
        undefined,
      priceMzn,
      stock,
      categoryId:
        row.categoryId?.trim() ||
        undefined,
      active:
        row.active !== "false",
      variants: hasVariant
        ? [
            {
              colorHex:
                row.colorHex?.trim() ||
                undefined,
              size:
                row.size?.trim() ||
                undefined,
              stock: Number(
                row.variantStock || row.stock
              ),
              active: true
            }
          ]
        : undefined
    });
  }

  return rows;
}

function downloadTemplate() {
  const csv =
    "name,description,priceMzn,stock,categoryId,active,colorHex,size,variantStock\n" +
    "Samsung A04,Exemplo,8500,10,,true,#000000,,10\n";

  const a =
    document.createElement("a");

  a.href = URL.createObjectURL(
    new Blob([csv], {
      type: "text/csv;charset=utf-8"
    })
  );

  a.download =
    "twisisa-produtos-template.csv";

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

    try {
      const rows = parseCsv(
        await file.text()
      );

      setImportRows(rows);
      setImporting(true);
    } catch (e) {
      setImportRows(null);

      setImportError(
        e instanceof Error
          ? e.message
          : "CSV_INVALID"
      );
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

      if (r.failed.length) {
        setImportError(
          `${r.created} criados; ${r.failed.length} linhas rejeitadas.`
        );
      } else {
        setImporting(false);
        setImportRows(null);
      }

      await reload();
    } catch (e) {
      setImportError(
        e instanceof ApiError
          ? e.code
          : "IMPORT_FAILED"
      );
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

      {importing && importRows && (
        <Modal
          title="Pré-visualização CSV"
          onClose={() =>
            !savingImport &&
            setImporting(false)
          }
        >
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
                    {index + 2}.
                  </strong>{" "}
                  {row.name} ·{" "}
                  {row.priceMzn} MZN · stock{" "}
                  {row.stock}
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
        </Modal>
      )}
    </div>
  );
}
