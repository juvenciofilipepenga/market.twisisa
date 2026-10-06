import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { adminError } from "@/lib/errors";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { prepareImage } from "@/lib/compressImage";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TrashIcon, PlusIcon, BoxIcon } from "../icons";

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

type DraftVariant = {
  id: string;
  colorHex: string;
  size: string;
  stock: string;
  active: boolean;
};

const DEFAULT_VARIANT_COLOR = "#2563EB";

const makeVariant = (
  v?: ProductVariant,
  defaultColorHex = DEFAULT_VARIANT_COLOR
): DraftVariant => ({
  id: v?.id ?? crypto.randomUUID(),
  colorHex: v ? v.colorHex ?? "" : defaultColorHex,
  size: v?.size ?? "",
  stock: String(v?.stock ?? 0),
  active: v?.active ?? true
});

export function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved
}: Props) {
  const { t } = useLocale();
  const { token } = useAuth();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceMzn, setPriceMzn] = useState(product?.priceMzn ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<DraftVariant[]>(
    (product?.variants ?? []).map((v) => makeVariant(v))
  );
  const [images, setImages] = useState(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // Produto já gravado nesta sessão (criado agora). Se o envio das imagens falhar, o formulário passa a
  // editar ESTE produto: tentar de novo não cria um duplicado.
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const target = savedProduct ?? product;

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  function handleClose() {
    if (savedProduct) onSaved(savedProduct); // fecha e recarrega a lista (o produto já existe)
    else onClose();
  }

  const categoryName =
    categories.find((c) => c.id === categoryId)?.name.toLowerCase() ?? "";

  const likelySizeCategory =
    /roup|vest|camis|calça|calcado|calçado|sapato|ténis|tenis|sandália|sandalia/.test(
      categoryName
    );

  const variantStock = variants.reduce(
    (sum, v) => sum + Math.max(0, Number(v.stock) || 0),
    0
  );

  useEffect(() => {
    setImages(product?.images ?? []);
    setVariants((product?.variants ?? []).map((v) => makeVariant(v)));
  }, [product]);

  function updateVariant(id: string, patch: Partial<DraftVariant>) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  }

  function addVariant() {
    const defaultColor = likelySizeCategory ? "" : DEFAULT_VARIANT_COLOR;
    setVariants((prev) => [...prev, makeVariant(undefined, defaultColor)]);
  }

  function removeVariant(id: string) {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) return;

    setSaving(true);
    setError(null);

    try {
      const cleanVariants = variants.map((v) => {
        const colorHex = v.colorHex.trim() || undefined;
        const size = v.size.trim() || undefined;

        return {
          colorHex,
          size,
          stock: Number(v.stock),
          active: v.active
        };
      });

      const hasVariants = cleanVariants.length > 0;

      if (hasVariants && cleanVariants.some((v) => !v.colorHex && !v.size)) {
        throw new Error("VARIANT_ATTRIBUTE_REQUIRED");
      }

      const payload = {
        name: name.trim(),
        description: target
          ? description.trim() || null
          : description.trim() || undefined,
        priceMzn: Number(priceMzn),
        stock: hasVariants ? variantStock : Number(stock),
        categoryId: target ? categoryId || null : categoryId || undefined,
        active,
        // [] numa edição desativa as variantes existentes (sem isto não havia como voltar a "stock único").
        ...(hasVariants
          ? { variants: cleanVariants }
          : target && (target.variants?.length ?? 0) > 0
            ? { variants: [] }
            : {})
      };

      const saved = target
        ? await api.admin.products.update(token, target.id, payload)
        : await api.admin.products.create(token, {
            ...payload,
            description: payload.description ?? undefined,
            categoryId: payload.categoryId ?? undefined
          });

      const uploadedImages: Product["images"] = [];
      const failedFiles: File[] = [];
      let lastError: unknown = null;

      if (pendingFiles.length) {
        setUploading(true);

        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          if (!file) continue;

          try {
            const prepared = await prepareImage(file);
            const uploaded = await api.media.upload(prepared, token);
            const image = await api.admin.products.addImage(token, saved.id, {
              url: uploaded.url,
              publicId: uploaded.publicId,
              isPrimary: images.length === 0 && uploadedImages.length === 0
            });
            uploadedImages.push(image);
          } catch (err) {
            failedFiles.push(file);
            lastError = err;
          }
        }
      }

      const finalProduct = {
        ...saved,
        images: [...images, ...uploadedImages],
        variants: saved.variants ?? []
      };

      if (failedFiles.length) {
        // O produto ficou gravado; só estas imagens falharam. Fica aberto, com o motivo à vista.
        setSavedProduct(finalProduct);
        setImages(finalProduct.images);
        setPendingFiles(failedFiles);
        setError(
          `Produto guardado, mas ${failedFiles.length} imagem(ns) não foram enviadas. ${adminError(lastError, t)}`
        );
        return;
      }

      onSaved(finalProduct);
      onClose();
    } catch (err) {
      setError(adminError(err, t));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function onRemoveImage(imageId: string) {
    const current = savedProduct ?? product;
    if (!token || !current) return;

    try {
      await api.admin.products.removeImage(token, current.id, imageId);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err) {
      setError(adminError(err, t));
    }
  }

  return (
    <Modal
      title={product ? t("common.edit") : t("admin.products.new")}
      onClose={handleClose}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("auth.name")}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Descrição"
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={priceMzn}
            onChange={(e) => setPriceMzn(e.target.value)}
            placeholder="Preço (MZN)"
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />

          <input
            required={!variants.length}
            disabled={variants.length > 0}
            type="number"
            min={0}
            value={variants.length ? variantStock : stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">— Sem categoria —</option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <section className="rounded-2xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Variantes</p>

              <p className="text-xs text-ink-faint">
                Use blocos de cor e/ou tamanhos. O stock é controlado por
                variante.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addVariant}
            >
              <PlusIcon width={15} height={15} />
              Adicionar
            </Button>
          </div>

          {likelySizeCategory && variants.length === 0 && (
            <p className="mb-2 text-xs text-ink-muted">
              Esta categoria parece usar tamanhos. Pode adicionar as
              combinações necessárias.
            </p>
          )}

          {variants.length === 0 ? (
            <p className="text-xs text-ink-faint">
              Sem variantes. O produto usará um único stock.
            </p>
          ) : (
            <div className="space-y-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-[48px_1fr_82px_36px] items-center gap-2 rounded-xl border border-border p-2"
                >
                  <label
                    className="relative h-10 w-10 overflow-hidden rounded-lg border border-border"
                    title="Selecionar cor"
                  >
                    <input
                      type="color"
                      value={v.colorHex || DEFAULT_VARIANT_COLOR}
                      onChange={(e) =>
                        updateVariant(v.id, { colorHex: e.target.value })
                      }
                      className="absolute inset-0 h-14 w-14 -translate-x-1 -translate-y-1 cursor-pointer border-0 p-0"
                    />
                  </label>

                  <input
                    value={v.size}
                    onChange={(e) =>
                      updateVariant(v.id, { size: e.target.value })
                    }
                    placeholder="Tamanho (opcional)"
                    className="min-w-0 rounded-lg border border-border bg-elevated px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
                  />

                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) =>
                      updateVariant(v.id, { stock: e.target.value })
                    }
                    aria-label="Stock da variante"
                    className="w-full rounded-lg border border-border bg-elevated px-2 py-2 text-sm focus:border-primary focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger"
                    aria-label="Remover variante"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          {t("common.active")}
        </label>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold text-ink-muted">
            Imagens do produto
          </p>

          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={img.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {img.isPrimary && (
                  <span className="absolute left-0.5 top-0.5 rounded bg-primary px-1 text-[9px] font-bold text-white">
                    P
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            ))}

            {pendingFiles.map((file, i) => (
              <button
                type="button"
                key={`${file.name}-${i}`}
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                title="Toque para retirar"
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-primary bg-primary-soft p-1 text-center text-[9px] text-primary"
              >
                {file.name}
              </button>
            ))}

            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-ink-faint hover:border-primary hover:text-primary disabled:opacity-40"
            >
              {uploading ? (
                <BoxIcon width={18} height={18} />
              ) : (
                <PlusIcon width={18} height={18} />
              )}
            </button>

            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                e.target.value = "";
                setPendingFiles((prev) => [...prev, ...picked].slice(0, 8));
              }}
            />
          </div>

          <p className="text-[11px] text-ink-faint">
            Pode seleccionar até 8 imagens. Serão enviadas ao guardar.
          </p>
        </div>

        {error && (
          <p
            ref={errorRef}
            role="alert"
            className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            {t("common.cancel")}
          </Button>

          <Button type="submit" className="flex-1" loading={saving}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
