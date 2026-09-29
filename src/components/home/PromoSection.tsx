import { useLocale } from "@/i18n/LocaleContext";
import { TagIcon } from "../icons";
import { EmptyState } from "../ui/EmptyState";

// O backend não tem, para já, nenhum conceito de desconto/cupão a nível de produto ou de
// encomenda (o desconto da encomenda existe no esquema mas é sempre 0 — "sem cupões ainda",
// comentário do próprio backend em src/routes/orders.ts). Por isso esta secção mostra um
// estado vazio honesto em vez de inventar promoções. Fica documentado no README como o que
// falta no backend para isto ficar completo (ex.: Product.compareAtPriceMzn ou tabela Promotion).
export function PromoSection() {
  const { t } = useLocale();
  return (
    <section className="px-4 py-4">
      <h2 className="mb-3 text-lg font-bold">{t("home.promo")}</h2>
      <EmptyState title={t("home.promo.empty")} icon={<TagIcon width={26} height={26} />} />
    </section>
  );
}
