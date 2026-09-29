import { Outlet } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";
import { CookieNotice } from "./CookieNotice";
import { ScrollToTop } from "./ScrollToTop";

// Envolve todas as páginas públicas: cada página continua a desenhar o seu Header;
// o rodapé e o aviso de cookies vêm daqui. O admin fica de fora (layout próprio).
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <div className="flex-1"><Outlet /></div>
      <SiteFooter />
      <CookieNotice />
    </div>
  );
}
