import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useToast } from "../ui/Toast";

// Páginas que exigem sessão: se o token expirar, o cliente é avisado e levado ao login,
// e volta exactamente onde estava depois de entrar.
const PROTECTED = ["/perfil", "/encomenda", "/notificacoes"];

export function SessionWatcher() {
  const { t } = useLocale();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    function onUnauthorized() {
      toast.show(t("toast.sessionExpired"), { tone: "error" });
      if (PROTECTED.some((p) => pathname.startsWith(p))) navigate(`/entrar?next=${encodeURIComponent(pathname + search)}`, { replace: true });
    }
    window.addEventListener("twisisa:unauthorized", onUnauthorized);
    return () => window.removeEventListener("twisisa:unauthorized", onUnauthorized);
  }, [pathname, search, t, toast, navigate]);

  return null;
}
