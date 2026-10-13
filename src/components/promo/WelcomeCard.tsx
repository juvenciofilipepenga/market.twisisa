import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { WELCOME_FLAG, WHATSAPP_GROUP_URL } from "@/config/community";
import { Button, buttonClass } from "../ui/Button";
import { Modal } from "../ui/Modal";

// Aparece UMA vez, logo depois de criar conta: boas-vindas e convite para o grupo de WhatsApp de novidades.
// Nunca interrompe o carrinho, o pagamento nem o login; se houver outro diálogo aberto, espera pela página seguinte.
const QUIET_ROUTES = ["/pagamento", "/carrinho", "/entrar", "/registar"];

export function WelcomeCard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const quiet = QUIET_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!user || quiet) return;
    let pending = false;
    try { pending = window.localStorage.getItem(WELCOME_FLAG) === "1"; } catch { /* sem armazenamento: sem cartão */ }
    if (!pending) return;
    const timer = window.setTimeout(() => {
      if (document.querySelector('[role="dialog"]')) return;
      try { window.localStorage.removeItem(WELCOME_FLAG); } catch { /* segue */ }
      setOpen(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [user, quiet, pathname]);

  if (!open || !user) return null;
  const firstName = user.name.trim().split(/\s+/)[0];
  const close = () => setOpen(false);

  return (
    <Modal size="sm" title={`${t("welcome.hello")} ${firstName}`} onClose={close}>
      <p className="text-sm leading-relaxed text-ink-muted">{t(WHATSAPP_GROUP_URL ? "welcome.bodyGroup" : "welcome.bodyPlain")}</p>
      <div className="mt-5 flex flex-col gap-2">
        {WHATSAPP_GROUP_URL ? (
          <>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" onClick={close} className={buttonClass("primary", "lg", "w-full")}>{t("welcome.join")}</a>
            <Button variant="ghost" onClick={close}>{t("promo.dismiss")}</Button>
          </>
        ) : (
          <Button size="lg" onClick={close}>{t("welcome.start")}</Button>
        )}
      </div>
    </Modal>
  );
}
