import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { CART_BUMP_EVENT } from "@/lib/fx";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import type { Product } from "@/lib/types";
import { formatMzn } from "@/lib/format";
import { SearchIcon, BellIcon, CartIcon, BoxIcon, UserIcon } from "../icons";
import { LanguageToggle } from "./LanguageToggle";

const iconButton = "press relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-elevated hover:text-ink";

function CountBadge({ value, bumpKey = 0 }: { value: number; bumpKey?: number }) {
  if (value <= 0) return null;
  return (
    <span key={bumpKey} className={`absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ${bumpKey ? "bump" : ""}`}>
      {value > 9 ? "9+" : value}
    </span>
  );
}

export function Header() {
  const { t } = useLocale();
  const { count } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [unread, setUnread] = useState(0);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Esconde ao descer, volta ao subir; nunca some enquanto se pesquisa.
  const hidden = useHideOnScroll(searchFocused || showSuggestions);

  useEffect(() => {
    if (!token) { setUnread(0); return; }
    api.notifications.list(token).then((res) => {
      setUnread(res.data.filter((n) => !n.readAt).length);
    }).catch(() => { /* silencioso: o número de notificações não é crítico */ });
  }, [token]);

  // O produto que "voa" para o carrinho avisa aqui quando aterra, e o número dá um pequeno salto.
  useEffect(() => {
    const onBump = () => setBumpKey((k) => k + 1);
    window.addEventListener(CART_BUMP_EVENT, onBump);
    return () => window.removeEventListener(CART_BUMP_EVENT, onBump);
  }, []);

  // Sugestões ao vivo: reaproveita GET /products?search= com limit=5 (não há endpoint próprio).
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) { setSuggestions([]); return; }
    const timeout = setTimeout(() => {
      api.products.list({ search: term, limit: 5 }).then((res) => setSuggestions(res.data)).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(search.trim() ? `/?search=${encodeURIComponent(search.trim())}` : "/");
  }

  function goToProduct(id: string) {
    setShowSuggestions(false);
    navigate(`/produto/${id}`);
  }

  // Telemóvel: 2 linhas (marca + acções, depois pesquisa). Ecrã largo: 1 linha.
  return (
    <header className={`safe-top sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${hidden ? "-translate-y-full" : ""}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 md:flex-nowrap md:py-3">
        <Link to="/" aria-label={t("nav.home")} className="order-1 flex shrink-0 items-center gap-2 rounded-xl py-1 pr-2">
          <img src="/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px]" />
          <span className="font-display text-lg font-extrabold leading-none tracking-tight">
            Twisisa<span className="ml-1 hidden font-semibold text-ink-muted sm:inline">Market</span>
          </span>
        </Link>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-0.5 md:order-3 md:ml-0">
          <Link to="/notificacoes" className={iconButton} aria-label={t("nav.notifications")}>
            <BellIcon /><CountBadge value={unread} />
          </Link>
          <Link to="/carrinho" data-cart-target className={iconButton} aria-label={t("nav.cart")}>
            <CartIcon /><CountBadge value={count} bumpKey={bumpKey} />
          </Link>
          <Link to={token ? "/perfil" : "/entrar"} className={iconButton} aria-label={token ? t("nav.profile") : t("auth.login")}>
            <UserIcon />
          </Link>
          <LanguageToggle />
        </div>

        <div ref={boxRef} className="relative order-3 w-full md:order-2 md:w-auto md:flex-1">
          <form onSubmit={onSubmit} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" width={18} height={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { setShowSuggestions(true); setSearchFocused(true); }}
              onBlur={() => setSearchFocused(false)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              enterKeyHint="search"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
          </form>

          {showSuggestions && search.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface p-1 shadow-2xl shadow-black/50">
              {suggestions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-faint">{t("search.noSuggestions")}</p>
              ) : (
                suggestions.map((p) => {
                  const image = p.images.find((i) => i.isPrimary) ?? p.images[0];
                  return (
                    <button key={p.id} onClick={() => goToProduct(p.id)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-elevated">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-elevated">
                        {image ? <img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
                          <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={14} height={14} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs font-semibold text-ink-muted">{formatMzn(p.priceMzn)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
