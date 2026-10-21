import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";

// Protege um ecrã de administração pelo perfil. É só conforto de interface: cada rota da API volta a verificar a permissão.
export function RequirePermission({ perm, children }: { perm: string | string[]; children: ReactNode }) {
  const { can } = useAuth();
  const { t } = useLocale();
  const list = Array.isArray(perm) ? perm : [perm];
  if (list.some(can)) return <>{children}</>;
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
      <p className="text-sm text-ink-muted">{t("admin.noAccess")}</p>
      <Link to="/admin" className="mt-3 inline-block text-sm font-semibold text-ink underline underline-offset-4">{t("admin.login.back")}</Link>
    </div>
  );
}
