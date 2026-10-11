import type { ProductVariant } from "@/lib/types";
import { HEX, isColorName, optionKeyOf, variantOptions } from "@/lib/catalog";

// Rascunho de uma variante no formulário: valores por opção (Cor, Tamanho, Capacidade…), stock, SKU e preço opcional.
export interface DraftVariant {
  id: string;
  values: Record<string, string>;
  stock: string;
  sku: string;
  price: string;
  active: boolean;
}

/** Erro de validação do formulário, já com o texto pronto para mostrar. */
export class FormIssue extends Error {
  constructor(public readonly text: string) {
    super(text);
  }
}

export const MAX_OPTIONS = 4;
export const SUGGESTED_OPTIONS = ["Cor", "Tamanho", "Capacidade", "Configuração"];
export const PALETTE = ["#000000", "#FFFFFF", "#EF4444", "#2563EB", "#16A34A", "#EAB308", "#6B7280", "#92400E"];

/** Nomes das opções, pela ordem em que aparecem nas variantes. */
export function namesFromVariants(variants: ProductVariant[]): string[] {
  const names: string[] = [];
  for (const variant of variants) for (const name of Object.keys(variantOptions(variant))) if (!names.includes(name)) names.push(name);
  return names;
}

export function makeDraft(names: string[], from?: ProductVariant): DraftVariant {
  const options = from ? variantOptions(from) : {};
  return {
    id: from?.id ?? crypto.randomUUID(),
    values: Object.fromEntries(names.map((name) => [name, options[name] ?? ""])),
    stock: String(from?.stock ?? 0),
    sku: from?.sku ?? "",
    price: from?.priceMzn ? String(Number(from.priceMzn)) : "",
    active: from?.active ?? true
  };
}

export const draftKey = (names: string[], draft: DraftVariant) =>
  optionKeyOf(Object.fromEntries(names.map((name) => [name, (draft.values[name] ?? "").trim()])));

/** Chaves repetidas (mesma combinação) → ids das variantes em conflito, para as destacar no ecrã. */
export function duplicateIds(names: string[], drafts: DraftVariant[]): Set<string> {
  const seen = new Map<string, string>();
  const dup = new Set<string>();
  for (const draft of drafts) {
    if (names.some((name) => !(draft.values[name] ?? "").trim())) continue;
    const key = draftKey(names, draft);
    const first = seen.get(key);
    if (first) { dup.add(first); dup.add(draft.id); } else seen.set(key, draft.id);
  }
  return dup;
}

/** Validação antes de enviar: o que o servidor também verifica, mas com mensagens que dizem ONDE está o problema. */
export function validateVariants(t: (k: string) => string, names: string[], drafts: DraftVariant[]): void {
  if (names.length === 0) throw new FormIssue(t("admin.err.VARIANTS_NEED_OPTION"));
  if (drafts.length === 0) throw new FormIssue(t("admin.err.VARIANTS_EMPTY"));
  const skus = new Set<string>();
  drafts.forEach((draft, index) => {
    const at = `(#${index + 1})`;
    for (const name of names) {
      const value = (draft.values[name] ?? "").trim();
      if (!value) throw new FormIssue(`${t("admin.err.VARIANT_INCOMPLETE")} ${at}: ${name}`);
      if (isColorName(name) && !HEX.test(value)) throw new FormIssue(`${t("admin.err.VARIANT_COLOR_INVALID")} ${at}`);
    }
    const stock = Number(draft.stock);
    if (!Number.isInteger(stock) || stock < 0) throw new FormIssue(`${t("admin.err.VARIANT_STOCK_INVALID")} ${at}`);
    if (draft.price.trim() && !(Number(draft.price) > 0)) throw new FormIssue(`${t("admin.err.VARIANT_PRICE_INVALID")} ${at}`);
    const sku = draft.sku.trim().toLowerCase();
    if (sku) {
      if (skus.has(sku)) throw new FormIssue(`${t("admin.err.DUPLICATE_SKU")} ${at}`);
      skus.add(sku);
    }
  });
  const dup = duplicateIds(names, drafts);
  if (dup.size > 0) {
    const numbers = drafts.map((d, i) => (dup.has(d.id) ? i + 1 : 0)).filter(Boolean).map((n) => `#${n}`).join(", ");
    throw new FormIssue(`${t("admin.err.DUPLICATE_VARIANT")} (${numbers})`);
  }
}
