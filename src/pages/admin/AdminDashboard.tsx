import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { StatCard } from "@/components/admin/StatCard";
import { BoxIcon, ClipboardIcon, TagIcon } from "@/components/icons";

// Sem endpoint de estatísticas agregadas no backend: cada número aqui vem de uma chamada
// de listagem com limit=1 só para ler "pagination.total", ou (stock baixo) de uma página
// de até 100 produtos filtrada no cliente. Funciona bem para um catálogo pequeno/médio;
// para um catálogo grande valeria a pena um endpoint /admin/stats dedicado no backend.
const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { t } = useLocale();
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [pendingOrders, setPendingOrders] = useState<number | null>(null);
  const [paidOrders, setPaidOrders] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin.products.list(token, { limit: 1 }).then((r) => setTotalProducts(r.pagination.total)).catch(() => setTotalProducts(0));
    api.admin.products.list(token, { limit: 100, includeInactive: false }).then((r) =>
      setLowStock(r.data.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length)
    ).catch(() => setLowStock(0));
    Promise.all([
      api.admin.orders.list(token, { status: "PENDING_PAYMENT", limit: 1 }),
      api.admin.orders.list(token, { status: "PAYMENT_REVIEW", limit: 1 })
    ]).then(([a, b]) => setPendingOrders(a.pagination.total + b.pagination.total)).catch(() => setPendingOrders(0));
    api.admin.orders.list(token, { status: "PAID", limit: 1 }).then((r) => setPaidOrders(r.pagination.total)).catch(() => setPaidOrders(0));
  }, [token]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{t("admin.greeting")} {user?.name.split(" ")[0]}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{t("admin.nav.dashboard")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("admin.dashboard.products")} value={totalProducts} icon={<BoxIcon width={18} height={18} />} />
        <StatCard label={t("admin.dashboard.lowStock")} value={lowStock} icon={<TagIcon width={18} height={18} />} />
        <StatCard label={t("admin.dashboard.pendingOrders")} value={pendingOrders} icon={<ClipboardIcon width={18} height={18} />} />
        <StatCard label={t("admin.dashboard.paidOrders")} value={paidOrders} icon={<ClipboardIcon width={18} height={18} />} />
      </div>
    </div>
  );
}
