import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { useCart } from "@/cart/CartContext";
import { useNotifications } from "@/notifications/NotificationsContext";
import { HomeIcon, SearchIcon, CartIcon, BellIcon, UserIcon, LogInIcon } from "../icons";

// Barra de navegação inferior (só telemóvel): é o que dá à loja o comportamento de uma app.
// O VISITANTE vê 4 separadores (… e "Entrar"); o CLIENTE (sessão iniciada) vê 5 (notificações e conta).
// Esconde-se onde já existe uma barra de acção fixa (produto, carrinho) e enquanto se escreve num campo
// (o teclado já ocupa metade do ecrã). Enquanto visível, marca <html data-bottom-nav>: o CSS reserva-lhe espaço
// (--nav-h) e os avisos/chat sobem acima dela.
const HIDDEN_ON = ["/produto/", "/carrinho"];
const NON_TEXT_INPUTS = ["checkbox", "radio", "button", "submit", "range", "file", "color"];

type Item = { to: string; cartTarget?: boolean; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>>; badge?: number; active: boolean };

export function BottomNav() {
  const { t } = useLocale();
  const { token } = useAuth();
  const { count } = useCart();
  const { unread } = useNotifications();
  const { pathname } = useLocation();
  const [typing, setTyping] = useState(false);
  const visible = !typing && !HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    const isTextField = (el: EventTarget | null) =>
      el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !NON_TEXT_INPUTS.includes(el.type));
    const onIn = (e: FocusEvent) => { if (isTextField(e.target)) setTyping(true); };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.setAttribute("data-bottom-nav", ""); else root.removeAttribute("data-bottom-nav");
    return () => root.removeAttribute("data-bottom-nav");
  }, [visible]);

  if (!visible) return null;

  const items: Item[] = [
    { to: "/", label: t("nav.home"), Icon: HomeIcon, active: pathname === "/" },
    { to: "/pesquisa", label: t("nav.search"), Icon: SearchIcon, active: pathname.startsWith("/pesquisa") },
    { to: "/carrinho", cartTarget: true, label: t("nav.cart"), Icon: CartIcon, badge: count, active: false },
    ...(token
      ? [
          { to: "/notificacoes", label: t("nav.notifications"), Icon: BellIcon, badge: unread, active: pathname.startsWith("/notificacoes") },
          { to: "/perfil", label: t("nav.account"), Icon: UserIcon, active: pathname.startsWith("/perfil") || pathname.startsWith("/definicoes") }
        ]
      : [{ to: "/entrar", label: t("auth.login"), Icon: LogInIcon, active: false }])
  ];

  return (
    <nav aria-label="Principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex h-[3.75rem] max-w-md items-stretch">
        {items.map(({ to, cartTarget, label, Icon, badge, active }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              data-cart-target={cartTarget ? "" : undefined}
              aria-current={active ? "page" : undefined}
              // Tocar em "Início" quando já se está na página inicial sobe ao topo (como nas apps).
              onClick={(e) => { if (to === "/" && pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
              className={`press relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${active ? "text-primary-text" : "text-ink-faint"}`}
            >
              {active && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <span className="relative">
                <Icon width={22} height={22} />
                {badge ? <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{badge > 9 ? "9+" : badge}</span> : null}
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
