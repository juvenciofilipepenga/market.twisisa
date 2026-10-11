import { useState } from "react";
import { isColorName } from "@/lib/catalog";
import { formatMzn } from "@/lib/format";
import { Button } from "../../ui/Button";
import { PlusIcon, TrashIcon } from "../../icons";
import { inputCls, Switch } from "./Section";
import { duplicateIds, makeDraft, MAX_OPTIONS, PALETTE, SUGGESTED_OPTIONS, type DraftVariant } from "./draft";

function ColorPicker({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {PALETTE.map((hex) => (
        <button key={hex} type="button" aria-label={hex} aria-pressed={value.toLowerCase() === hex.toLowerCase()} onClick={() => onChange(hex)}
          className={`press h-9 w-9 rounded-full border-2 ${value.toLowerCase() === hex.toLowerCase() ? "border-primary" : "border-border"}`} style={{ backgroundColor: hex }} />
      ))}
      <label className="press relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-border px-3 text-xs font-semibold text-ink-muted">
        <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: value || "transparent" }} />
        {value && !PALETTE.some((h) => h.toLowerCase() === value.toLowerCase()) ? value.toUpperCase() : "Outra"}
        <input type="color" value={value || "#808080"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`${label}: outra cor`} />
      </label>
    </div>
  );
}

// Variantes flexíveis: o administrador define as OPÇÕES do produto (Cor, Tamanho, Capacidade… ou as que quiser) e regista
// só as combinações que realmente vende. Nada é gerado automaticamente.
export function VariantsEditor({ enabled, onEnabled, names, onNames, drafts, onDrafts, disabledSaved, onReactivate, baseStock }: {
  enabled: boolean; onEnabled: (v: boolean) => void;
  names: string[]; onNames: (n: string[]) => void;
  drafts: DraftVariant[]; onDrafts: (d: DraftVariant[]) => void;
  disabledSaved: DraftVariant[]; onReactivate: (id: string) => void;
  baseStock: number;
}) {
  const [custom, setCustom] = useState("");
  const dup = duplicateIds(names, drafts);

  const addName = (raw: string) => {
    const name = raw.trim().slice(0, 30);
    if (!name || names.some((n) => n.toLowerCase() === name.toLowerCase()) || names.length >= MAX_OPTIONS) return;
    onNames([...names, name]);
    onDrafts(drafts.map((d) => ({ ...d, values: { ...d.values, [name]: "" } })));
    setCustom("");
  };
  const removeName = (name: string) => {
    onNames(names.filter((n) => n !== name));
    onDrafts(drafts.map((d) => ({ ...d, values: Object.fromEntries(Object.entries(d.values).filter(([k]) => k !== name)) })));
  };
  const patch = (id: string, change: Partial<DraftVariant>) => onDrafts(drafts.map((d) => (d.id === id ? { ...d, ...change } : d)));
  const setValue = (id: string, name: string, value: string) => onDrafts(drafts.map((d) => (d.id === id ? { ...d, values: { ...d.values, [name]: value } } : d)));
  const total = drafts.filter((d) => d.active).reduce((n, d) => n + Math.max(0, Number(d.stock) || 0), 0);
  const prices = drafts.map((d) => Number(d.price)).filter((n) => n > 0);

  return (
    <div className="space-y-4">
      <Switch checked={enabled} onChange={onEnabled} label="Este produto tem variantes"
        help="Para produtos com escolhas (cor, tamanho, capacidade…). Sem variantes, o produto usa um só stock." />

      {!enabled && <p className="rounded-xl bg-elevated px-3 py-2.5 text-xs text-ink-muted">Produto simples: usa o preço e o stock indicados acima ({baseStock} em stock).</p>}

      {enabled && (
        <>
          {/* 1) Que opções o cliente escolhe */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-muted">1. O que o cliente escolhe</p>
            <div className="flex flex-wrap gap-2">
              {names.map((name) => (
                <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-soft py-1 pl-3 pr-1 text-sm font-semibold">
                  {name}
                  <button type="button" onClick={() => removeName(name)} aria-label={`Remover opção ${name}`} className="press flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:text-danger"><TrashIcon width={13} height={13} /></button>
                </span>
              ))}
              {names.length === 0 && <span className="text-xs text-ink-faint">Escolha pelo menos uma opção.</span>}
            </div>
            {names.length < MAX_OPTIONS && (
              <>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_OPTIONS.filter((s) => !names.some((n) => n.toLowerCase() === s.toLowerCase())).map((s) => (
                    <button key={s} type="button" onClick={() => addName(s)} className="press rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-muted hover:border-ink-faint">+ {s}</button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={30} placeholder="Outra opção (ex.: Material)" className={inputCls}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addName(custom); } }} />
                  <Button type="button" variant="secondary" onClick={() => addName(custom)} disabled={!custom.trim()}>Adicionar</Button>
                </div>
              </>
            )}
          </div>

          {/* 2) Só as combinações que existem */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-muted">2. As combinações que vende</p>
            <div className="space-y-3">
              {drafts.map((draft, index) => (
                <article key={draft.id} className={`rounded-2xl border p-3 ${dup.has(draft.id) ? "border-danger" : "border-border"} ${draft.active ? "" : "opacity-70"}`}>
                  <header className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold">Variante {index + 1}</h4>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => onDrafts([...drafts.slice(0, index + 1), { ...draft, id: crypto.randomUUID(), sku: "", values: { ...draft.values } }, ...drafts.slice(index + 1)])}>Duplicar</Button>
                      <Button type="button" size="icon" variant="ghost" aria-label={`Remover variante ${index + 1}`} onClick={() => onDrafts(drafts.filter((d) => d.id !== draft.id))}><TrashIcon width={16} height={16} /></Button>
                    </div>
                  </header>
                  <div className="space-y-3">
                    {names.map((name) => (
                      <div key={name}>
                        <p className="mb-1 text-xs font-semibold text-ink-muted">{name}</p>
                        {isColorName(name)
                          ? <ColorPicker value={draft.values[name] ?? ""} onChange={(hex) => setValue(draft.id, name, hex)} label={`${name} da variante ${index + 1}`} />
                          : <input value={draft.values[name] ?? ""} onChange={(e) => setValue(draft.id, name, e.target.value)} maxLength={60} placeholder={name === "Tamanho" ? "Ex.: M, 42" : name === "Capacidade" ? "Ex.: 256 GB" : `Valor de ${name}`} className={inputCls} />}
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-ink-muted">Stock</p>
                        <input type="number" inputMode="numeric" min={0} value={draft.stock} onChange={(e) => patch(draft.id, { stock: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-ink-muted">Preço (opcional)</p>
                        <input type="number" inputMode="decimal" min={0} step="0.01" value={draft.price} onChange={(e) => patch(draft.id, { price: e.target.value })} placeholder="Igual ao do produto" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-ink-muted">Código de referência (SKU, opcional)</p>
                      <input value={draft.sku} onChange={(e) => patch(draft.id, { sku: e.target.value })} maxLength={60} className={inputCls} />
                    </div>
                    <Switch checked={draft.active} onChange={(v) => patch(draft.id, { active: v })} label="Disponível para venda" />
                    {dup.has(draft.id) && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">Esta combinação está repetida noutra variante.</p>}
                  </div>
                </article>
              ))}
            </div>
            <Button type="button" variant="secondary" className="mt-3 w-full" disabled={names.length === 0} onClick={() => onDrafts([...drafts, makeDraft(names)])}>
              <PlusIcon width={15} height={15} />Adicionar variante
            </Button>
          </div>

          {drafts.length > 0 && (
            <p className="rounded-xl bg-elevated px-3 py-2.5 text-xs text-ink-muted">
              <strong className="text-ink">{drafts.length}</strong> {drafts.length === 1 ? "variante" : "variantes"} · <strong className="text-ink">{total}</strong> em stock
              {prices.length > 0 && <> · preços de <strong className="text-ink">{formatMzn(Math.min(...prices))}</strong> a <strong className="text-ink">{formatMzn(Math.max(...prices))}</strong></>}
            </p>
          )}

          {disabledSaved.length > 0 && (
            <details className="rounded-xl border border-border px-3 py-2.5 text-sm">
              <summary className="cursor-pointer font-medium text-ink-muted">Variantes desativadas ({disabledSaved.length})</summary>
              <p className="mt-2 text-xs text-ink-faint">Ficam guardadas por causa das encomendas antigas. Pode reativá-las.</p>
              <ul className="mt-2 space-y-1.5">
                {disabledSaved.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate">{Object.values(d.values).filter(Boolean).join(" · ") || "—"}</span>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onReactivate(d.id)}>Reativar</Button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
