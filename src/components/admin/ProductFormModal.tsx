import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import type { Category, Product } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TrashIcon, PlusIcon, BoxIcon } from "../icons";

interface Props {
  product: Product | null; // null = criação
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: Props) {
  const { t } = useLocale();
  const { token } = useAuth();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceMzn, setPriceMzn] = useState(product?.priceMzn ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setImages(product?.images ?? []); }, [product]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      priceMzn: Number(priceMzn),
      stock: Number(stock),
      categoryId: categoryId || undefined,
      active
    };
    try {
      const saved = product
        ? await api.admin.products.update(token, product.id, payload)
        : await api.admin.products.create(token, payload);
      onSaved({ ...saved, images: product ? images : [] });
      if (!product) onClose(); // criação simples termina aqui; para adicionar imagens, editar depois
    } catch {
      setError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File) {
    if (!token || !product) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.media.upload(file, token);
      const image = await api.admin.products.addImage(token, product.id, { url: uploaded.url, publicId: uploaded.publicId, isPrimary: images.length === 0 });
      setImages((prev) => [...prev, image]);
    } catch {
      setError(t("common.error"));
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveImage(imageId: string) {
    if (!token || !product) return;
    await api.admin.products.removeImage(token, product.id, imageId);
    setImages((prev) => prev.filter((i) => i.id !== imageId));
  }

  return (
    <Modal title={product ? t("common.edit") : t("admin.products.new")} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descrição"
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" min={0} step="0.01" value={priceMzn} onChange={(e) => setPriceMzn(e.target.value)} placeholder="Preço (MZN)"
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input required type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock"
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none">
          <option value="">— Sem categoria —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
          {t("common.active")}
        </label>

        {product && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold text-ink-muted">Imagens</p>
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                  <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  {img.isPrimary && <span className="absolute left-0.5 top-0.5 rounded bg-primary px-1 text-[9px] font-bold text-white">P</span>}
                  <button type="button" onClick={() => onRemoveImage(img.id)} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-ink-faint hover:border-primary hover:text-primary disabled:opacity-40">
                {uploading ? <BoxIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
              </button>
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
            </div>
          </div>
        )}

        {!product && (
          <p className="text-xs text-ink-faint">Guarde o produto primeiro; depois volte a editá-lo para adicionar imagens.</p>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" className="flex-1" loading={saving}>{t("common.save")}</Button>
        </div>
      </form>
    </Modal>
  );
}
