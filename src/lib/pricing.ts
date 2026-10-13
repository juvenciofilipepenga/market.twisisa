import type { PricingInput, PricingThresholds, ProductPricing } from "./types";

// Espelho de backend/src/services/pricing.ts (a fórmula e o arredondamento TÊM de ser iguais): serve só para mostrar o
// resultado enquanto se escreve. Quem decide o preço guardado é o servidor, que o recalcula a partir dos custos.
//
//   custo total      = compra × (1 + taxas%) + transporte + outros gastos
//   preço de tabela  = custo total × (1 + retorno%) ÷ (1 − comissão%)
//   preço ao cliente = preço de tabela × (1 − desconto%), arredondado para cima ao metical
//   lucro            = preço ao cliente × (1 − comissão%) − custo total
//   retorno real     = lucro ÷ custo total × 100
export type ProfitLevel = "loss" | "low" | "good" | "excellent";

export interface PricingResult {
  costTotal: number;
  listPrice: number;
  customerPrice: number;
  profit: number;
  returnPct: number;
  level: ProfitLevel;
}

export const DEFAULT_THRESHOLDS: PricingThresholds = { goodFromPct: 30, excellentFromPct: 80 };

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const ceilMzn = (value: number): number => Math.ceil(round2(value));

export function levelOf(returnPct: number, thresholds: PricingThresholds = DEFAULT_THRESHOLDS): ProfitLevel {
  if (returnPct < 0) return "loss";
  if (returnPct < thresholds.goodFromPct) return "low";
  if (returnPct >= thresholds.excellentFromPct) return "excellent";
  return "good";
}

export function computePricing(input: PricingInput, thresholds: PricingThresholds = DEFAULT_THRESHOLDS): PricingResult {
  const costTotal = round2(input.purchaseMzn * (1 + input.taxPct / 100) + input.transportMzn + input.otherCostsMzn);
  const listPrice = ceilMzn((costTotal * (1 + input.returnPct / 100)) / (1 - input.commissionPct / 100));
  const customerPrice = ceilMzn(listPrice * (1 - input.discountPct / 100));
  const profit = round2(customerPrice * (1 - input.commissionPct / 100) - costTotal);
  const returnPct = costTotal > 0 ? round2((profit / costTotal) * 100) : 0;
  return { costTotal, listPrice, customerPrice, profit, returnPct, level: levelOf(returnPct, thresholds) };
}

// Valores como texto, porque é assim que os campos do formulário os guardam.
export interface PricingDraft { purchase: string; tax: string; transport: string; other: string; returnPct: string; commission: string; discount: string }

export const EMPTY_PRICING_DRAFT: PricingDraft = { purchase: "", tax: "", transport: "", other: "", returnPct: "", commission: "", discount: "" };

export function draftFromPricing(p: ProductPricing | null | undefined): PricingDraft {
  if (!p) return EMPTY_PRICING_DRAFT;
  const show = (value: string) => (Number(value) === 0 ? "" : String(Number(value)));
  return { purchase: String(Number(p.purchaseMzn)), tax: show(p.taxPct), transport: show(p.transportMzn), other: show(p.otherCostsMzn), returnPct: String(Number(p.returnPct)), commission: show(p.commissionPct), discount: show(p.discountPct) };
}

/** null = ainda não dá para calcular (falta a compra ou o retorno, ou há valores fora dos limites que o servidor também recusa). */
export function toPricingInput(d: PricingDraft): PricingInput | null {
  const n = (value: string) => (value.trim() === "" ? 0 : Number(value.replace(",", ".")));
  if (d.purchase.trim() === "" || d.returnPct.trim() === "") return null;
  const input: PricingInput = { purchaseMzn: n(d.purchase), taxPct: n(d.tax), transportMzn: n(d.transport), otherCostsMzn: n(d.other), returnPct: n(d.returnPct), commissionPct: n(d.commission), discountPct: n(d.discount) };
  const ok = Object.values(input).every(Number.isFinite) && input.purchaseMzn > 0 && input.taxPct >= 0 && input.taxPct <= 100
    && input.transportMzn >= 0 && input.otherCostsMzn >= 0 && input.returnPct >= 0 && input.returnPct <= 1000
    && input.commissionPct >= 0 && input.commissionPct <= 60 && input.discountPct >= 0 && input.discountPct <= 50;
  return ok ? input : null;
}
