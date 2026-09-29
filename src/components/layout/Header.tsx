import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { useCart } from "@/cart/CartContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatMzn } from "@/lib/format";
import { SearchIcon, BellIcon, CartIcon, BoxIcon, UserIcon } from "../icons";
import { LanguageToggle } from "./LanguageToggle";

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
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { setUnread(0); return; }
    api.notifications.list(token).then((res) => {
      setUnread(res.data.filter((n) => !n.readAt).length);
    }).catch(() => { /* silencioso: badge de notificações não é crítico */ });
  }, [token]);

  // Sugestões ao vivo: reaproveita o mesmo GET /products?search= do catálogo, só que com
  // limit=5 — o backend não tem um endpoint de sugestões próprio.
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

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {/* Logótipo = sempre o botão para voltar à página inicial, com nome visível mesmo em
            ecrãs pequenos (antes só aparecia em sm:, o que tornava difícil perceber que dava
            para voltar ao início a partir de qualquer página). */}
        <Link to="/" aria-label={t("nav.home")} className="flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1 active:bg-elevated">
          <img src="/logo.png" alt="" width={28} height={28} />
          <span className="text-sm font-bold tracking-tight">Twisisa</span>
        </Link>

        <div ref={boxRef} className="relative flex-1">
          <form onSubmit={onSubmit} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" width={18} height={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
            />
          </form>

          {showSuggestions && search.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-xl">
              {suggestions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-ink-faint">{t("search.noSuggestions")}</p>
              ) : (
                suggestions.map((p) => {
                  const image = p.images.find((i) => i.isPrimary) ?? p.images[0];
                  return (
                    <button key={p.id} onClick={() => goToProduct(p.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-elevated">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-elevated">
                        {image ? <img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
                          <div className="flex h-full w-full items-center justify-center text-ink-faint"><BoxIcon width={14} height={14} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{p.name}</p>
                        <p className="text-xs text-primary">{formatMzn(p.priceMzn)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link to="/notificacoes" className="relative rounded-lg p-2 text-ink-muted hover:bg-elevated hover:text-ink" aria-label={t("nav.notifications")}>
            <BellIcon />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link to="/carrinho" className="relative rounded-lg p-2 text-ink-muted hover:bg-elevated hover:text-ink" aria-label={t("nav.cart")}>
            <CartIcon />
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          <Link to={token ? "/perfil" : "/entrar"} className="rounded-lg p-2 text-ink-muted hover:bg-elevated hover:text-ink" aria-label={token ? t("nav.profile") : t("auth.login")}>
            <UserIcon />
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
