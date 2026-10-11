import { useLocale } from "@/i18n/LocaleContext";
import { isValueAvailable } from "@/lib/catalog";
import type { OptionDef, ProductVariant } from "@/lib/types";
import { CheckIcon } from "../icons";

// Escolha de opções do produto (Cor, Tamanho, Capacidade, Configuração…). Só aparece o que existe de verdade, e um valor
// que não combina com o que já foi escolhido (ou sem stock) fica riscado e não se pode escolher: assim nunca se compra
// uma combinação que não existe.
export function OptionPicker({ defs, variants, selected, onSelect, onClear }: {
  defs: OptionDef[]; variants: ProductVariant[]; selected: Record<string, string>;
  onSelect: (name: string, value: string) => void; onClear: () => void;
}) {
  const { t } = useLocale();
  const anySelected = Object.values(selected).some(Boolean);
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      {defs.map((def) => (
        <fieldset key={def.name}>
          <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-semibold">
            <span>{def.name}</span>
            {selected[def.name] && def.kind === "TEXT" && <span className="font-normal text-ink-muted">{selected[def.name]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {def.values.map((value) => {
              const chosen = selected[def.name] === value;
              const available = isValueAvailable(variants, def.name, value, selected);
              const common = `press relative flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${available ? "" : "opacity-40"}`;
              return def.kind === "COLOR" ? (
                <button
                  key={value} type="button" aria-pressed={chosen} aria-disabled={!available} disabled={!available}
                  aria-label={`${def.name} ${value}${available ? "" : ` (${t("product.unavailable")})`}`}
                  onClick={() => onSelect(def.name, value)}
                  className={`${common} h-11 w-11 rounded-full border-2 ${chosen ? "border-primary" : "border-border"}`}
                >
                  <span className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: value }} />
                  {chosen && <CheckIcon width={16} height={16} className="absolute text-white mix-blend-difference" />}
                  {!available && <span aria-hidden="true" className="absolute h-0.5 w-9 rotate-45 bg-ink-muted" />}
                </button>
              ) : (
                <button
                  key={value} type="button" aria-pressed={chosen} aria-disabled={!available} disabled={!available}
                  onClick={() => onSelect(def.name, value)}
                  className={`${common} min-h-[44px] min-w-[44px] rounded-xl border px-3.5 text-sm font-semibold ${chosen ? "border-primary bg-primary-soft text-ink" : "border-border bg-elevated text-ink-muted"} ${available ? "" : "line-through"}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {anySelected && <button type="button" onClick={onClear} className="press text-sm font-medium text-primary underline-offset-2 hover:underline">{t("product.clearChoice")}</button>}
    </div>
  );
}
