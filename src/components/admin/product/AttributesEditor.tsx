import type { CategoryAttribute } from "@/lib/types";
import { inputCls, Labeled } from "./Section";

// Características técnicas pedidas pela categoria escolhida (definidas pelo admin em Categorias). Cada tipo tem o seu campo.
export function AttributesEditor({ defs, values, onChange, missing }: {
  defs: CategoryAttribute[]; values: Record<string, string>; onChange: (id: string, value: string) => void; missing: Set<string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {defs.map((def) => {
        const value = values[def.id] ?? "";
        const label = `${def.name}${def.type === "MEASURE" && def.unit ? ` (${def.unit})` : ""}`;
        const bad = missing.has(def.id);
        return (
          <div key={def.id} className={bad ? "rounded-xl ring-2 ring-danger/50" : ""}>
            <Labeled label={label} required={def.required}>
              {def.type === "SELECT" ? (
                <select value={value} onChange={(e) => onChange(def.id, e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : def.type === "BOOLEAN" ? (
                <select value={value} onChange={(e) => onChange(def.id, e.target.value)} className={inputCls}>
                  <option value="">—</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              ) : def.type === "NUMBER" || def.type === "MEASURE" ? (
                <input type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(def.id, e.target.value)} className={inputCls} />
              ) : (
                <input value={value} maxLength={300} onChange={(e) => onChange(def.id, e.target.value)} className={inputCls} />
              )}
            </Labeled>
          </div>
        );
      })}
    </div>
  );
}
