import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { useCart } from "@/cart/CartContext";
import { HomeIcon, SearchIcon, CartIcon, UserIcon, MoreIcon } from "../icons";

// BARRA INFERIOR: exactamente 5 destinos, sempre os mesmos e sempre na mesma ordem (simples, rápida, previsível):
// Início · Pesquisa · Carrinho · Conta · Mais. Nenhuma funcionalidade nova cria um 6.º item: o que não é navegação
// principal entra em "Mais" (ver config/more.ts). As notificações vivem no cabeçalho, ao lado do idioma.
// "Conta" leva o visitante a entrar e o cliente ao seu perfil. O carrinho mostra o número de itens, em tempo real.
// O separador activo vê-se por cor, barra no topo, rótulo a negrito e aria-current (nunca só pela cor).
// Esconde-se apenas enquanto se escreve num campo (o teclado já ocupa metade do ecrã).
// Enquanto visível, marca <html data-bottom-nav>: o CSS reserva-lhe espaço (--nav-h) e os avisos/chat/barras fixas
// de produto e carrinho sobem acima dela.
const MORE_PATHS = ["/mais", "/definicoes", "/pedidos", "/instalar", "/termos", "/privacidade", "/cookies"];
const NON_TEXT_INPUTS = ["checkbox", "radio", "button", "submit", "range", "file", "color"];

type Item = { to: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: number; active: boolean; cartTarget?: boolean };

export function BottomNav() {
  const { t } = useLocale();
  const { token } = useAuth();
  const { count } = useCart();
  const { pathname } = useLocation();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const isTextField = (el: EventTarget | null) =>
      el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !NON_TEXT_INPUTS.includes(el.type));
    const onIn = (e: FocusEvent) => { if (isTextField(e.target)) setTyping(true); };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  const visible = !typing;
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.setAttribute("data-bottom-nav", ""); else root.removeAttribute("data-bottom-nav");
    return () => root.removeAttribute("data-bottom-nav");
  }, [visible]);

  if (!visible) return null;

  const items: Item[] = [
    { to: "/", label: t("nav.home"), Icon: HomeIcon, active: pathname === "/" },
    { to: "/pesquisa", label: t("nav.search"), Icon: SearchIcon, active: pathname.startsWith("/pesquisa") },
    { to: "/carrinho", label: t("nav.cart"), Icon: CartIcon, badge: count, active: pathname.startsWith("/carrinho"), cartTarget: true },
    { to: token ? "/perfil" : "/entrar", label: t("nav.account"), Icon: UserIcon, active: pathname.startsWith("/perfil") || pathname.startsWith("/entrar") || pathname.startsWith("/registar") },
    { to: "/mais", label: t("nav.more"), Icon: MoreIcon, active: MORE_PATHS.some((p) => pathname.startsWith(p)) }
  ];

  return (
    <nav aria-label="Principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex h-[3.75rem] max-w-md items-stretch">
        {items.map(({ to, label, Icon, badge, active, cartTarget }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              data-cart-target={cartTarget ? "" : undefined}
              aria-current={active ? "page" : undefined}
              aria-label={badge ? `${label}: ${badge}` : undefined}
              // Tocar em "Início" quando já se está na página inicial sobe ao topo (como nas apps).
              onClick={(e) => { if (to === "/" && pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
              className={`press relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${active ? "font-bold text-primary-text" : "font-medium text-ink-faint"}`}
            >
              {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <span className="relative">
                <Icon width={22} height={22} strokeWidth={active ? 2.4 : 1.8} />
                {badge ? <span aria-hidden="true" className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</span> : null}
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
