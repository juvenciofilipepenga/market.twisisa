import { useNavigate, useSearchParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const active = searchParams.get("categoryId");
  const search = searchParams.get("search") ?? undefined;
  const categories = useCategories();
  const rail = `no-scrollbar flex gap-2 overflow-x-auto ${embedded ? "" : "px-4 py-4"}`;

  function select(categoryId: string | null) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    navigate(`/${params.toString() ? `?${params.toString()}` : ""}`);
  }

  if (categories === null) {
    return (
      <div className={rail}>
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />)}
      </div>
    );
  }

  return (
    <div className={rail}>
      <button onClick={() => select(null)} aria-pressed={!active} className={`${chip} ${!active ? chipOn : chipOff}`}>
        {t("categories.all")}
      </button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => select(c.id)} aria-pressed={active === c.id} className={`${chip} ${active === c.id ? chipOn : chipOff}`}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
