import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import AdminDashboard from "./AdminDashboard";

// Quem pode ver o painel vê o painel; os outros perfis entram direto na primeira área que podem usar.
const LANDING: Array<{ perm: string; to: string }> = [
  { perm: "orders.view", to: "/admin/pedidos" },
  { perm: "payments.view", to: "/admin/pagamentos" },
  { perm: "support.manage", to: "/admin/chat" },
  { perm: "catalog.products", to: "/admin/produtos" },
  { perm: "catalog.categories", to: "/admin/categorias" },
  { perm: "finance.settings", to: "/admin/fatura" },
  { perm: "users.view", to: "/admin/utilizadores" },
  { perm: "team.manage", to: "/admin/equipa" }
];

export default function AdminHome() {
  const { can } = useAuth();
  const { t } = useLocale();
  if (can("dashboard.view")) return <AdminDashboard />;
  const target = LANDING.find((item) => can(item.perm));
  if (target) return <Navigate to={target.to} replace />;
  return <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 text-center text-sm text-ink-muted">{t("admin.noAreas")}</div>;
}
