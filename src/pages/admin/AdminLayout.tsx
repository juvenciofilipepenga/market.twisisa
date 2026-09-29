import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { AdminShell } from "@/components/admin/AdminShell";

// Guarda de acesso do lado do cliente: esconde a interface para quem não tem sessão de
// admin. A autorização REAL continua a ser sempre imposta pelo backend em cada pedido
// (todos os endpoints /admin/* exigem token ADMIN/SUPER_ADMIN) — isto é só UX, não segurança.
// /admin/login é uma rota irmã (fora deste layout), por isso não há aqui nenhum caso especial
// a evitar loop de redireccionamento.
export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/admin/login", { replace: true });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-ink-muted">…</div>;
  }
  return <AdminShell><Outlet /></AdminShell>;
}
