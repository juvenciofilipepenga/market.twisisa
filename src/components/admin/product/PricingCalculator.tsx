import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatMzn } from "@/lib/format";
import { computePricing, DEFAULT_THRESHOLDS, toPricingInput, type PricingDraft, type ProfitLevel } from "@/lib/pricing";
import type { PricingThresholds } from "@/lib/types";
import { Labeled, inputCls } from "./Section";

// Verde = lucro bom, vermelho = lucro deprimido. A etiqueta escrita acompanha a cor (não depende só da cor para se perceber).
const TONES: Record<ProfitLevel, { label: string; box: string; text: string; chip: string }> = {
  loss: { label: "Prejuízo", box: "border-danger/40 bg-danger/10", text: "text-danger", chip: "bg-danger text-white" },
  low: { label: "Lucro baixo", box: "border-danger/40 bg-danger/10", text: "text-danger", chip: "bg-danger/15 text-danger" },
  good: { label: "Lucro bom", box: "border-success/40 bg-success/10", text: "text-success", chip: "bg-success/15 text-success" },
  excellent: { label: "Excelente", box: "border-success/40 bg-success/10", text: "text-success", chip: "bg-success text-white" }
};

interface Props {
  draft: PricingDraft;
  onChange: (next: PricingDraft) => void;
  /** Preço antigo de um produto sem custos: mostra-se até o admin preencher a compra. */
  legacyPrice: string | null;
  hasVariants: boolean;
}

export function PricingCalculator({ draft, onChange, legacyPrice, hasVariants }: Props) {
  const { token } = useAuth();
  const [limits, setLimits] = useState<PricingThresholds>(DEFAULT_THRESHOLDS);
  const [good, setGood] = useState(String(DEFAULT_THRESHOLDS.goodFromPct));
  const [excellent, setExcellent] = useState(String(DEFAULT_THRESHOLDS.excellentFromPct));
  const [limitsMsg, setLimitsMsg] = useState<string | null>(null);
  const [savingLimits, setSavingLimits] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.admin.pricingSettings.get(token).then((value) => {
      setLimits(value);
      setGood(String(value.goodFromPct));
      setExcellent(String(value.excellentFromPct));
    }).catch(() => { /* sem limites do servidor, usam-se os de origem (30% e 80%) */ });
  }, [token]);

  const set = (key: keyof PricingDraft) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...draft, [key]: e.target.value });
  const input = toPricingInput(draft);
  const result = input ? computePricing(input, limits) : null;
  const tone = result ? TONES[result.level] : null;

  async function saveLimits() {
    if (!token) return;
    const next = { goodFromPct: Number(good), excellentFromPct: Number(excellent) };
    if (!Number.isFinite(next.goodFromPct) || !Number.isFinite(next.excellentFromPct) || next.goodFromPct < 0 || next.excellentFromPct <= next.goodFromPct) {
      setLimitsMsg("O limite de «excelente» tem de ser maior que o de «bom».");
      return;
    }
    setSavingLimits(true);
    try {
      setLimits(await api.admin.pricingSettings.update(token, next));
      setLimitsMsg("Limites guardados.");
    } catch {
      setLimitsMsg("Não foi possível guardar os limites.");
    } finally {
      setSavingLimits(false);
    }
  }

  const num = (props: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; max?: number }) => (
    <input type="number" inputMode="decimal" min={0} max={props.max} step="0.01" value={props.value} onChange={props.onChange} className={inputCls} />
  );

  return (
    <div className="space-y-3">
      <Labeled label="Preço de compra na loja física (MZN)" required>
        {num({ value: draft.purchase, onChange: set("purchase") })}
      </Labeled>
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Taxas (%)" hint="Sobre a compra">{num({ value: draft.tax, onChange: set("tax"), max: 100 })}</Labeled>
        <Labeled label="Transporte (MZN)" hint="Ir buscar o produto">{num({ value: draft.transport, onChange: set("transport") })}</Labeled>
        <Labeled label="Outros gastos (MZN)">{num({ value: draft.other, onChange: set("other") })}</Labeled>
        <Labeled label="Comissão (%)" hint="Do preço de venda">{num({ value: draft.commission, onChange: set("commission"), max: 60 })}</Labeled>
        <Labeled label="Retorno desejado (%)" required hint="Sobre o custo total">{num({ value: draft.returnPct, onChange: set("returnPct"), max: 1000 })}</Labeled>
        <Labeled label="Desconto (%)" hint="Máximo 50">{num({ value: draft.discount, onChange: set("discount"), max: 50 })}</Labeled>
      </div>

      {result && tone ? (
        <div className={`rounded-xl border p-3 ${tone.box}`} role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink-muted">Preço de venda</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone.chip}`}>{tone.label}</span>
          </div>
          <p className={`font-display text-3xl font-extrabold tabular-nums ${tone.text}`}>{formatMzn(result.customerPrice)}</p>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div><dt className="text-ink-muted">Custo total</dt><dd className="font-semibold tabular-nums">{formatMzn(result.costTotal)}</dd></div>
            <div><dt className="text-ink-muted">Lucro</dt><dd className={`font-semibold tabular-nums ${tone.text}`}>{formatMzn(result.profit)}</dd></div>
            <div><dt className="text-ink-muted">Retorno</dt><dd className={`font-semibold tabular-nums ${tone.text}`}>{result.returnPct}%</dd></div>
          </dl>
          {hasVariants && <p className="mt-2 text-xs text-ink-muted">As variantes usam este preço, a menos que tenham o seu.</p>}
        </div>
      ) : (
        <p className="rounded-xl bg-elevated px-3 py-2.5 text-xs text-ink-muted">
          {legacyPrice && !draft.purchase.trim()
            ? `Preço atual: ${formatMzn(Number(legacyPrice))}, sem custos registados. Preencha a compra e o retorno para o calcular.`
            : "Preencha a compra e o retorno desejado para ver o preço de venda."}
        </p>
      )}

      <details className="rounded-xl border border-border px-3 py-2 text-xs text-ink-muted">
        <summary className="cursor-pointer font-semibold text-ink">Como é calculado e limites de lucro</summary>
        <ul className="mt-2 space-y-1">
          <li>Custo total = compra + taxas sobre a compra + transporte + outros gastos.</li>
          <li>Preço de tabela = custo total × (1 + retorno) ÷ (1 − comissão).</li>
          <li>Preço de venda = preço de tabela − desconto, arredondado para cima ao metical.</li>
          <li>Lucro = preço de venda − comissão − custo total. Retorno real = lucro ÷ custo total.</li>
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Labeled label="«Bom» a partir de (%)"><input type="number" min={0} step="1" value={good} onChange={(e) => setGood(e.target.value)} className={inputCls} /></Labeled>
          <Labeled label="«Excelente» a partir de (%)"><input type="number" min={0} step="1" value={excellent} onChange={(e) => setExcellent(e.target.value)} className={inputCls} /></Labeled>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Button type="button" size="sm" variant="secondary" loading={savingLimits} onClick={saveLimits}>Guardar limites</Button>
          {limitsMsg && <span role="status">{limitsMsg}</span>}
        </div>
      </details>
    </div>
  );
}
