import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { Spinner } from "@/components/ui/Spinner";

// Guarda da área de administração. Três tipos de pessoa, três destinos:
//  • visitante (sem sessão)         → /admin/login
//  • cliente (sessão, sem papel admin) → de volta à loja (não vê nada do painel)
//  • administrador                  → só entra DEPOIS de o servidor confirmar a sessão e os papéis (`verified`),
//    para que editar o localStorage não mostre a interface de admin.
// A autorização REAL continua a ser sempre do backend: todos os endpoints /admin/* exigem papel ADMIN/SUPER_ADMIN
// e o backend lê o papel e o estado da conta na base de dados em cada pedido.
export default function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { user, loading, verified, isAdmin } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/admin/login", { replace: true });
    else if (verified && !isAdmin) navigate("/", { replace: true });
  }, [loading, user, verified, isAdmin, navigate]);

  useEffect(() => {
    if (verified) return;
    const id = window.setTimeout(() => setSlow(true), 6000);
    return () => window.clearTimeout(id);
  }, [verified]);

  if (loading || !user || !verified || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-sm text-ink-muted">
        <Spinner size={22} />
        <p>{t("admin.verifying")}</p>
        {slow && (
          <>
            <p className="text-warning">{t("admin.verifyFailed")}</p>
            <Link to="/" className="font-semibold text-ink underline underline-offset-4">{t("admin.login.back")}</Link>
          </>
        )}
      </div>
    );
  }
  return <AdminShell><Outlet /></AdminShell>;
}
