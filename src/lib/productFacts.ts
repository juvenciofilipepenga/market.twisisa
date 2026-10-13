import { formatAttributeValue, HEX, variantOptions } from "./catalog";
import type { Product } from "./types";

// O que o cartão de produto mostra além da imagem e do nome. TUDO vem dos dados reais do produto:
// variantes com stock, características públicas configuradas para a categoria, preço efectivo das variantes.
// Nada é assumido por tipo de produto (telemóvel, roupa, calçado…): cada categoria mostra o que o admin definiu.

const MAX_COLORS = 5;
const MAX_TEXT_VALUES = 4;
const MAX_SPECS = 2;

export interface CardFacts {
  /** Cores (hex) com stock. */
  colors: string[];
  moreColors: number;
  /** Primeira opção que não é cor (Tamanho, Capacidade…), só com os valores que têm stock. */
  option: { name: string; values: string[]; more: number } | null;
  /** Até duas características públicas, já formatadas (ex.: "Armazenamento: 256 GB"). */
  specs: string[];
}

/** Variantes que o cliente ainda pode comprar. */
function buyable(product: Product) {
  return (product.variants ?? []).filter((v) => v.active !== false && v.stock > 0);
}

export function cardFacts(product: Product, yes: string, no: string): CardFacts {
  // Opções e valores: só os que existem numa variante com stock (um tamanho esgotado não deve parecer disponível).
  const defs = new Map<string, string[]>();
  for (const variant of buyable(product)) {
    for (const [name, value] of Object.entries(variantOptions(variant))) {
      const list = defs.get(name) ?? [];
      if (!list.includes(value)) list.push(value);
      defs.set(name, list);
    }
  }
  let colors: string[] = [];
  let option: CardFacts["option"] = null;
  for (const [name, values] of defs) {
    if (values.every((v) => HEX.test(v))) {
      if (colors.length === 0) colors = values;
    } else if (!option) {
      option = { name, values: values.slice(0, MAX_TEXT_VALUES), more: Math.max(0, values.length - MAX_TEXT_VALUES) };
    }
  }

  // Características: as marcadas como "filtráveis" são as que o admin considera decisivas; vêm primeiro.
  const filled = (product.attributes ?? []).filter((a) => a.showPublic && a.value !== null && a.value !== "");
  const ordered = [...filled.filter((a) => a.filterable), ...filled.filter((a) => !a.filterable)];
  const specs: string[] = [];
  for (const a of ordered) {
    if (a.type === "BOOLEAN") {
      // "Dual SIM: Não" não ajuda a descobrir nada: só se mostra o que o produto TEM.
      if (a.value === true || a.value === "true") specs.push(a.name);
    } else {
      specs.push(`${a.name}: ${formatAttributeValue(a.value, a.type, a.unit, yes, no)}`);
    }
    if (specs.length === MAX_SPECS) break;
  }

  return { colors: colors.slice(0, MAX_COLORS), moreColors: Math.max(0, colors.length - MAX_COLORS), option, specs };
}

export interface PriceInfo {
  amount: string | number;
  /** As variantes têm preços diferentes: mostra-se o mais baixo com "A partir de". */
  from: boolean;
}

/** Preço do cartão: o do produto, ou (com variantes à venda de preços diferentes) o mais baixo realmente disponível. */
export function priceInfo(product: Product): PriceInfo {
  const prices = buyable(product).map((v) => Number(v.effectivePriceMzn ?? v.priceMzn ?? product.priceMzn));
  if (prices.length === 0) return { amount: product.priceMzn, from: false };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { amount: min, from: max > min };
}
