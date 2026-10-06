import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Spinner } from "../ui/Spinner";

// Área de CLIENTE: só quem tem sessão entra. O visitante é enviado para /entrar e, depois de entrar,
// volta exactamente a esta página (?next=). Autorização real: continua a ser sempre do backend.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const { pathname, search } = useLocation();
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-ink-muted"><Spinner size={24} /></div>;
  if (!token) return <Navigate to={`/entrar?next=${encodeURIComponent(pathname + search)}`} replace />;
  return <>{children}</>;
}
