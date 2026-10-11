import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { adminError } from "@/lib/errors";
import { compressImage } from "@/lib/image";
import { formatMzn } from "@/lib/format";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import type { Category, CategoryAttribute, Product, VariantPayload } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { TrashIcon, PlusIcon, BoxIcon } from "../icons";
import { AttributesEditor } from "./product/AttributesEditor";
import { VariantsEditor } from "./product/VariantsEditor";
import { Section, inputCls, Labeled, Switch } from "./product/Section";
import { FormIssue, makeDraft, namesFromVariants, validateVariants, type DraftVariant } from "./product/draft";

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}

const MAX_IMAGES = 8;

// Valor guardado como texto no formulário → o que o servidor espera (texto, número, sim/não ou vazio).
function attributeToPayload(def: CategoryAttribute, raw: string): string | number | boolean | null {
  const value = raw.trim();
  if (!value) return null;
  if (def.type === "BOOLEAN") return value === "true";
  return value;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: Props) {
  const { t } = useLocale();
  const { token } = useAuth();

  // 1. Informações gerais · 4. Preço e inventário · 7. Publicação
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceMzn, setPriceMzn] = useState(product?.priceMzn ?? "");
  const [stock, setStock] = useState(String(product?.variants?.some((v) => v.active) ? 0 : product?.stock ?? 0));
  const [active, setActive] = useState(product?.active ?? true);
  // 2. Categoria e 5. Características
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [defs, setDefs] = useState<CategoryAttribute[] | null>(null);
  const [attrValues, setAttrValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((product?.attributes ?? []).filter((a) => a.value !== null).map((a) => [a.id, String(a.value)]))
  );
  const [missingAttrs, setMissingAttrs] = useState<Set<string>>(new Set());
  // 6. Variantes
  const savedVariants = product?.variants ?? [];
  const [names, setNames] = useState<string[]>(() => namesFromVariants(savedVariants));
  const [hasVariants, setHasVariants] = useState(savedVariants.some((v) => v.active));
  const [drafts, setDrafts] = useState<DraftVariant[]>(() => savedVariants.filter((v) => v.active).map((v) => makeDraft(namesFromVariants(savedVariants), v)));
  const [disabledSaved, setDisabledSaved] = useState<DraftVariant[]>(() => savedVariants.filter((v) => !v.active).map((v) => makeDraft(namesFromVariants(savedVariants), v)));
  // 3. Imagens
  const [images, setImages] = useState(product?.images ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Produto criado nesta sessão: se o envio das imagens falhar, guardar de novo ATUALIZA-o em vez de criar um duplicado.
  const createdRef = useRef<Product | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // O erro estava no fundo de um formulário comprido: ninguém o via. Agora rola até ele.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error]);

  // Características da categoria escolhida (definidas pelo admin).
  useEffect(() => {
    if (!token || !categoryId) { setDefs(categoryId ? null : []); return; }
    let cancelled = false;
    setDefs(null);
    api.admin.categoryAttributes.list(token, categoryId).then((list) => { if (!cancelled) setDefs(list); }).catch(() => { if (!cancelled) setDefs([]); });
    return () => { cancelled = true; };
  }, [token, categoryId]);

  const variantTotal = drafts.filter((d) => d.active).reduce((sum, d) => sum + Math.max(0, Number(d.stock) || 0), 0);
  const filledAttrs = (defs ?? []).filter((d) => (attrValues[d.id] ?? "").trim()).length;

  function reactivate(id: string) {
    const found = disabledSaved.find((d) => d.id === id);
    if (!found) return;
    // Garante que as opções da variante reativada existem no formulário.
    const missing = Object.keys(found.values).filter((n) => !names.includes(n));
    if (missing.length) setNames((prev) => [...prev, ...missing]);
    setDisabledSaved((prev) => prev.filter((d) => d.id !== id));
    setDrafts((prev) => [...prev, { ...found, active: true }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setMissingAttrs(new Set());

    try {
      const existing = product ?? createdRef.current;
      const price = Number(priceMzn);
      if (!name.trim()) throw new FormIssue(t("admin.err.INVALID_NAME"));
      if (!(price > 0)) throw new FormIssue(t("admin.err.PRICE_INVALID"));

      // Características obrigatórias (o servidor também verifica, aqui diz-se QUAL falta).
      const missing = new Set((defs ?? []).filter((d) => d.required && !(attrValues[d.id] ?? "").trim()).map((d) => d.id));
      if (active && missing.size > 0) {
        setMissingAttrs(missing);
        throw new FormIssue(`${t("admin.err.ATTRIBUTE_REQUIRED")}: ${(defs ?? []).filter((d) => missing.has(d.id)).map((d) => d.name).join(", ")}`);
      }

      let variants: VariantPayload[] | undefined;
      if (hasVariants) {
        validateVariants(t, names, drafts);
        variants = [
          ...drafts.map((d) => ({
            options: Object.fromEntries(names.map((n) => [n, (d.values[n] ?? "").trim()])),
            sku: d.sku.trim() || null,
            priceMzn: d.price.trim() ? Number(d.price) : null,
            stock: Number(d.stock),
            active: d.active
          })),
          ...disabledSaved.map((d) => ({
            options: Object.fromEntries(Object.entries(d.values as Record<string, string>).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])),
            sku: null, priceMzn: d.price.trim() ? Number(d.price) : null, stock: 0, active: false
          }))
        ];
      } else if (existing && (existing.variants ?? []).some((v) => v.active)) {
        variants = []; // [] numa edição desativa as variantes (voltar a produto simples)
      }

      const payload = {
        name: name.trim(),
        description: existing ? description.trim() || null : description.trim() || undefined,
        priceMzn: price,
        stock: hasVariants ? 0 : Number(stock),
        categoryId: existing ? categoryId || null : categoryId || undefined,
        active,
        ...(variants ? { variants } : {}),
        ...(defs !== null ? { attributes: defs.map((d) => ({ attributeId: d.id, value: attributeToPayload(d, attrValues[d.id] ?? "") })) } : {})
      };

      const saved = existing
        ? await api.admin.products.update(token, existing.id, payload as Parameters<typeof api.admin.products.update>[2])
        : await api.admin.products.create(token, payload as Parameters<typeof api.admin.products.create>[1]);
      if (!product) createdRef.current = saved;

      let finalProduct = { ...saved, images: existing ? images : [], variants: saved.variants ?? [] };

      if (pendingFiles.length) {
        setUploading(true);
        const uploadedImages: typeof images = [];
        let hasPrimary = images.some((img) => img.isPrimary);
        let failure: unknown = null;
        // Uma a uma: se uma falhar, as anteriores ficam guardadas e o formulário mantém só as que faltam.
        for (const file of pendingFiles) {
          try {
            const uploaded = await api.media.upload(file, token);
            const image = await api.admin.products.addImage(token, saved.id, { url: uploaded.url, publicId: uploaded.publicId, isPrimary: !hasPrimary });
            hasPrimary = true;
            uploadedImages.push(image);
            setPendingFiles((prev) => prev.filter((f) => f !== file));
          } catch (err) {
            failure = err;
            break;
          }
        }
        finalProduct = { ...finalProduct, images: [...finalProduct.images, ...uploadedImages] };
        setImages((prev) => [...prev, ...uploadedImages]);
        if (failure) {
          // O produto JÁ ficou guardado: a lista atualiza-se e o formulário fica aberto para repetir só as imagens em falta.
          onSaved(finalProduct);
          setError(`${t("admin.products.savedImagesFailed")} ${adminError(failure, t)}`);
          return;
        }
      }

      onSaved(finalProduct);
      onClose();
    } catch (err) {
      setError(err instanceof FormIssue ? err.text : adminError(err, t));
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  // Lê os ficheiros ANTES de limpar o campo (limpar primeiro esvazia a lista e nenhuma foto entrava, sem erro nenhum).
  async function addPicked(files: File[]) {
    setError(null);
    const room = Math.max(0, MAX_IMAGES - pendingFiles.length - images.length);
    const next: File[] = [];
    for (const file of files.slice(0, room)) {
      try {
        next.push(await compressImage(file));
      } catch {
        setError(t("admin.err.UNSUPPORTED_FILE_TYPE"));
      }
    }
    if (next.length) setPendingFiles((prev) => [...prev, ...next]);
  }

  async function onRemoveImage(imageId: string) {
    if (!token || !product) return;
    try {
      await api.admin.products.removeImage(token, product.id, imageId);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err) {
      setError(adminError(err, t));
    }
  }

  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <Modal title={product ? t("common.edit") : t("admin.products.new")} onClose={onClose} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <Section n={1} title="Informações gerais">
          <Labeled label="Nome do produto" required>
            <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={160} className={inputCls} />
          </Labeled>
          <Labeled label="Descrição">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={4000} className={inputCls} />
          </Labeled>
        </Section>

        <Section n={2} title="Categoria" hint="A categoria decide que características técnicas pode preencher.">
          <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setMissingAttrs(new Set()); }} className={inputCls} aria-label="Categoria">
            <option value="">— Sem categoria —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Section>

        <Section n={3} title="Imagens" hint={`Até ${MAX_IMAGES}. São reduzidas automaticamente e enviadas ao guardar. A primeira é a principal.`}>
          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                <img src={img.url} alt={img.altText ?? ""} className="absolute inset-0 h-full w-full object-cover" />
                {img.isPrimary && <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[10px] font-semibold text-white">Principal</span>}
                <button type="button" onClick={() => onRemoveImage(img.id)} aria-label="Apagar imagem" className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"><TrashIcon width={12} height={12} /></button>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <PendingThumb key={`${file.name}-${i}`} file={file} onRemove={() => setPendingFiles((prev) => prev.filter((f) => f !== file))} />
            ))}
            {images.length + pendingFiles.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileInput.current?.click()} className="press flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-ink-muted hover:border-ink-faint" aria-label="Adicionar imagens">
                {images.length + pendingFiles.length === 0 ? <BoxIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                <span className="text-[10px] font-semibold">Adicionar</span>
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => { const picked = Array.from(e.target.files ?? []); e.target.value = ""; void addPicked(picked); }} />
        </Section>

        <Section n={4} title="Preço e inventário">
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Preço base (MZN)" required hint={hasVariants ? "As variantes usam este preço, a menos que tenham o seu." : undefined}>
              <input required type="number" inputMode="decimal" min={0} step="0.01" value={priceMzn} onChange={(e) => setPriceMzn(e.target.value)} className={inputCls} />
            </Labeled>
            <Labeled label="Stock" hint={hasVariants ? "Soma das variantes." : undefined}>
              <input type="number" inputMode="numeric" min={0} required={!hasVariants} disabled={hasVariants} value={hasVariants ? variantTotal : stock} onChange={(e) => setStock(e.target.value)} className={`${inputCls} disabled:opacity-60`} />
            </Labeled>
          </div>
        </Section>

        <Section n={5} title="Características técnicas" hint={categoryName ? `Pedidas pela categoria «${categoryName}».` : undefined}>
          {!categoryId && <p className="rounded-xl bg-elevated px-3 py-2.5 text-xs text-ink-muted">Escolha uma categoria para ver as características que pode preencher.</p>}
          {categoryId && defs === null && <p className="text-xs text-ink-faint">A carregar…</p>}
          {categoryId && defs !== null && defs.length === 0 && <p className="rounded-xl bg-elevated px-3 py-2.5 text-xs text-ink-muted">Esta categoria ainda não tem características. Defina-as em Categorias → Características.</p>}
          {defs !== null && defs.length > 0 && <AttributesEditor defs={defs} values={attrValues} missing={missingAttrs} onChange={(id, value) => setAttrValues((prev) => ({ ...prev, [id]: value }))} />}
        </Section>

        <Section n={6} title="Variantes" hint="Só se o cliente tiver de escolher (cor, tamanho, capacidade…).">
          <VariantsEditor
            enabled={hasVariants} onEnabled={setHasVariants}
            names={names} onNames={setNames} drafts={drafts} onDrafts={setDrafts}
            disabledSaved={disabledSaved} onReactivate={reactivate} baseStock={Number(stock) || 0}
          />
        </Section>

        <Section n={7} title="Publicação e disponibilidade">
          <Switch checked={active} onChange={setActive} label="Visível na loja" help="Desligado, o produto fica guardado mas os clientes não o veem." />
        </Section>

        {/* Resumo: o que vai ser guardado */}
        <div className="rounded-xl bg-elevated px-3 py-3 text-xs text-ink-muted">
          <p className="mb-1 font-semibold text-ink">Vai guardar</p>
          <p>
            {name.trim() || "Produto sem nome"} · {Number(priceMzn) > 0 ? formatMzn(Number(priceMzn)) : "sem preço"} · {categoryName ?? "sem categoria"} · {hasVariants ? `${drafts.length} variantes, ${variantTotal} em stock` : `${Number(stock) || 0} em stock`} · {filledAttrs} características · {images.length + pendingFiles.length} imagens · {active ? "visível" : "oculto"}
          </p>
        </div>

        {error && <p ref={errorRef} role="alert" className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">{error}</p>}

        <div className="sticky bottom-0 -mx-1 flex gap-2 border-t border-border bg-surface px-1 pb-1 pt-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" className="flex-1" loading={saving || uploading}>{uploading ? "A enviar imagens…" : t("common.save")}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Miniatura da foto escolhida, com o botão de a retirar.
function PendingThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-primary">
      <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <button type="button" onClick={onRemove} aria-label="Retirar imagem" className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"><TrashIcon width={12} height={12} /></button>
    </div>
  );
}
