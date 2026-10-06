import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import { Button } from "../ui/Button";

const KEY = "twisisa.cookie-notice";

// Hoje o site só usa armazenamento essencial (sessão, carrinho, idioma): é um aviso, não um pedido de consentimento.
// Quando houver análise/publicidade, este componente passa a pedir escolha.
export function CookieNotice() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try { setVisible(window.localStorage.getItem(KEY) !== "ok"); } catch { setVisible(false); }
  }, []);

  function accept() {
    try { window.localStorage.setItem(KEY, "ok"); } catch { /* sem armazenamento: só fecha */ }
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div role="region" aria-label="Cookies" style={{ bottom: "calc(var(--nav-h, 0px) + 0.75rem)" }} className="safe-bottom toast-in fixed inset-x-3 z-50 flex items-start gap-3 rounded-2xl border border-border bg-elevated p-4 shadow-2xl shadow-black/60 sm:right-auto sm:max-w-sm">
      <img src={img.shield} alt="" width={40} height={48} className="h-10 w-auto shrink-0" />
      <div>
        <p className="text-sm leading-relaxed text-ink-muted">{t("cookie.text")}</p>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant="light" onClick={accept}>{t("cookie.ok")}</Button>
          <Link to="/cookies" className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink">{t("cookie.more")}</Link>
        </div>
      </div>
    </div>
  );
}
