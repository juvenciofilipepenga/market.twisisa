import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";

const KEY = "twisisa.cookie-notice";

// Hoje o site só usa armazenamento essencial (sessão, carrinho, idioma), por isso é um aviso e não
// um pedido de consentimento. Quando houver análise/publicidade, este componente passa a pedir escolha.
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
    <div role="region" aria-label="Cookies" className="safe-bottom fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-elevated p-4 shadow-2xl shadow-black/60 sm:right-auto sm:max-w-sm">
      <p className="text-sm leading-relaxed text-ink-muted">{t("cookie.text")}</p>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={accept} className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-bg hover:bg-white">{t("cookie.ok")}</button>
        <Link to="/cookies" className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink">{t("cookie.more")}</Link>
      </div>
    </div>
  );
}
