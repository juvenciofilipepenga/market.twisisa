import type { OptionDef, ProductVariant } from "./types";

// Regras de opções de variante no frontend. Espelham as do servidor (services/catalog.ts), para a escolha do cliente
// nunca apontar para uma combinação que não existe ou que não tem stock.
export const HEX = /^#[0-9a-fA-F]{6}$/;
export const isColorName = (name: string) => name.trim().toLowerCase() === "cor";

/** Mesma chave canónica do servidor: nomes em minúsculas por ordem alfabética, "nome=valor", tudo em minúsculas. */
export function optionKeyOf(options: Record<string, string>): string {
  return Object.entries(options)
    .map(([name, value]) => [name.trim().toLowerCase(), value.trim().toLowerCase()] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join("|");
}

/** Opções de uma variante. As antigas (só cor/tamanho) são convertidas. */
export function variantOptions(variant: Pick<ProductVariant, "options" | "colorHex" | "size">): Record<string, string> {
  if (variant.options && Object.keys(variant.options).length > 0) return variant.options;
  const out: Record<string, string> = {};
  if (variant.colorHex) out.Cor = variant.colorHex;
  if (variant.size) out.Tamanho = variant.size;
  return out;
}

/** Opções escolhíveis, deduzidas das variantes reais (só existe o que se vende). */
export function deriveOptionDefs(variants: ProductVariant[]): OptionDef[] {
  const defs = new Map<string, string[]>();
  for (const variant of variants.filter((v) => v.active !== false)) {
    for (const [name, value] of Object.entries(variantOptions(variant))) {
      const list = defs.get(name) ?? [];
      if (!list.includes(value)) list.push(value);
      defs.set(name, list);
    }
  }
  return [...defs.entries()].map(([name, values]) => ({ name, kind: values.every((v) => HEX.test(v)) ? "COLOR" : "TEXT", values }));
}

/** A variante só existe quando TODAS as opções estão escolhidas e a combinação completa existe. */
export function findSelectedVariant(variants: ProductVariant[], defs: OptionDef[], selected: Record<string, string>): ProductVariant | undefined {
  if (defs.length === 0 || defs.some((def) => !selected[def.name])) return undefined;
  return variants.find((variant) => {
    const options = variantOptions(variant);
    return defs.every((def) => options[def.name] === selected[def.name]);
  });
}

/** Um valor está disponível se existe uma variante com stock que o tenha E combine com o resto do que já foi escolhido. */
export function isValueAvailable(variants: ProductVariant[], optionName: string, value: string, selected: Record<string, string>): boolean {
  return variants.some((variant) => {
    const options = variantOptions(variant);
    if (variant.stock <= 0 || options[optionName] !== value) return false;
    return Object.entries(selected).every(([name, chosen]) => name === optionName || !chosen || options[name] === chosen);
  });
}

export function formatAttributeValue(value: string | number | boolean | null, type: string, unit: string | null, yes: string, no: string): string {
  if (value === null || value === "") return "—";
  if (type === "BOOLEAN") return value === true || value === "true" ? yes : no;
  if (typeof value === "number") return `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 4 }).format(value)}${unit ? ` ${unit}` : ""}`;
  return String(value);
}
