import { Outlet, useLocation } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";
import { CookieNotice } from "./CookieNotice";
import { ScrollToTop } from "./ScrollToTop";
import { PromoHost } from "../promo/PromoHost";

// Páginas públicas: cada página desenha o seu Header; o rodapé, o aviso de cookies e as promoções vêm daqui.
// A página nova entra com um fade curto (orienta a mudança), keyed no caminho.
export function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <div key={pathname} className="page-in flex-1"><Outlet /></div>
      <SiteFooter />
      <CookieNotice />
      <PromoHost />
    </div>
  );
}

// Entrar / registar: sem rodapé nem promoções, só o formulário (menos distracção = mais conversão).
export function FocusLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <div key={pathname} className="page-in"><Outlet /></div>
    </div>
  );
}
