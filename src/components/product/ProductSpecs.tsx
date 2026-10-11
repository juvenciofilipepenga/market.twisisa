import { useLocale } from "@/i18n/LocaleContext";
import { formatAttributeValue } from "@/lib/catalog";
import type { ProductAttributeView } from "@/lib/types";

// Características técnicas: uma tabela simples (nome à esquerda, valor à direita), só com o que o admin preencheu.
export function ProductSpecs({ attributes }: { attributes: ProductAttributeView[] }) {
  const { t } = useLocale();
  const rows = attributes.filter((a) => a.value !== null && a.value !== "");
  if (rows.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="specs-title">
      <h2 id="specs-title" className="text-lg font-extrabold">{t("product.specs")}</h2>
      <dl className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((a) => (
          <div key={a.id} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
            <dt className="shrink-0 text-ink-muted">{a.name}</dt>
            <dd className="text-right font-semibold">{formatAttributeValue(a.value, a.type, a.unit, t("product.yes"), t("product.no"))}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
