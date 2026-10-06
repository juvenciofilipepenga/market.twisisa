import { Outlet, useLocation } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";
import { CookieNotice } from "./CookieNotice";
import { BottomNav } from "./BottomNav";
import { ScrollToTop } from "./ScrollToTop";
import { PromoHost } from "../promo/PromoHost";

// Páginas da loja: cada página desenha o seu Header; o rodapé, a barra inferior (telemóvel), o aviso de cookies e
// as promoções vêm daqui. (pb-nav reserva espaço para a barra inferior quando ela está visível.)
// A página nova entra com um fade curto (orienta a mudança), keyed no caminho.
export function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="pb-nav flex min-h-screen flex-col">
      <ScrollToTop />
      <div key={pathname} className="page-in flex-1"><Outlet /></div>
      <SiteFooter />
      <BottomNav />
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
