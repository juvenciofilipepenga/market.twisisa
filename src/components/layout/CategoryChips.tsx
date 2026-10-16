import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCategories } from "@/lib/useCategories";
import { useLocale } from "@/i18n/LocaleContext";
import { Skeleton } from "../ui/Skeleton";

const chip = "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors";
const chipOff = "border-border bg-surface text-ink-muted hover:border-ink-faint hover:text-ink";
// Activo = claro sobre fundo escuro. O vermelho fica reservado às acções (comprar, continuar).
const chipOn = "border-ink bg-ink text-bg";

// "Todas" funciona como estado por omissão (sem filtro) — não existe opção explícita
// de "nenhuma categoria" à parte, conforme pedido.
// `embedded`: dentro de outro bloco (ex.: "Encontre o que procura"), que já tem o seu próprio espaçamento.
export function CategoryChips({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const { slug: activeSlug } = useParams<{ slug?: string }>();
  const search = searchParams.get("search") ?? undefined;
  const categories = useCategories();
  const rail = `no-scrollbar flex gap-2 overflow-x-auto ${embedded ? "" : "px-4 py-4"}`;

  // Ligações <a href> reais. Sem pesquisa, cada categoria tem a sua página indexável (/categoria/:slug);
  // com pesquisa, mantém-se o filtro em /?search=&categoryId= (não indexável).
  function hrefFor(c: { id: string; slug: string } | null): string {
    if (!search) return c ? `/categoria/${encodeURIComponent(c.slug)}` : "/";
    const params = new URLSearchParams({ search });
    if (c) params.set("categoryId", c.id);
    return `/?${params.toString()}`;
  }
  const activeId = searchParams.get("categoryId");
  const isActive = (c: { id: string; slug: string }) => (activeSlug ? activeSlug === c.slug : activeId === c.id);
  const noneActive = !activeSlug && !activeId;

  if (categories === null) {
    return (
      <div className={rail}>
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />)}
      </div>
    );
  }

  return (
    <div className={rail}>
      <Link to={hrefFor(null)} aria-current={noneActive ? "page" : undefined} className={`${chip} ${noneActive ? chipOn : chipOff}`}>
        {t("categories.all")}
      </Link>
      {categories.map((c) => (
        <Link key={c.id} to={hrefFor(c)} aria-current={isActive(c) ? "page" : undefined} className={`${chip} ${isActive(c) ? chipOn : chipOff}`}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
