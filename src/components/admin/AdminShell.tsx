import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { LanguageToggle } from "../layout/LanguageToggle";
import { LayoutDashboardIcon, PackageNavIcon, TagsNavIcon, OrdersNavIcon, UsersNavIcon, ChatNavIcon, StoreNavIcon } from "./navIcons";
import { LogOutIcon } from "../icons";

const NAV = [
  { href: "/admin", key: "admin.nav.dashboard", Icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/produtos", key: "admin.nav.products", Icon: PackageNavIcon, exact: false },
  { href: "/admin/categorias", key: "admin.nav.categories", Icon: TagsNavIcon, exact: false },
  { href: "/admin/pedidos", key: "admin.nav.orders", Icon: OrdersNavIcon, exact: false },
  { href: "/admin/utilizadores", key: "admin.nav.users", Icon: UsersNavIcon, exact: false },
  { href: "/admin/chat", key: "admin.nav.chat", Icon: ChatNavIcon, exact: false }
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  useDocumentMeta({ title: "Admin · Twisisa Market", noindex: true });
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(href: string, exact: boolean) {
    return exact ? location.pathname === href : location.pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <img src="/logo.png" alt="Twisisa Market" width={30} height={30} />
          <span className="font-display text-base font-extrabold leading-none">Twisisa <span className="font-semibold text-ink-muted">Admin</span></span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {/* Único ponto onde, dentro do admin, se volta à loja pública — antes não existia
              nenhuma ligação daqui para lá. */}
          <Link to="/" className="mb-2 flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-ink-muted hover:border-primary/50 hover:text-ink">
            <StoreNavIcon width={18} height={18} />{t("admin.nav.viewStore")}
          </Link>
          {NAV.map(({ href, key, Icon, exact }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(href, exact) ? "bg-primary-soft text-ink" : "text-ink-muted hover:bg-elevated hover:text-ink"}`}>
              <Icon width={18} height={18} className={isActive(href, exact) ? "text-primary-text" : ""} />{t(key)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <p className="truncate px-1 text-xs text-ink-faint">{user?.email}</p>
          <button onClick={() => { logout(); navigate("/admin/login"); }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10">
            <LogOutIcon width={16} height={16} />{t("admin.logout")}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="safe-top sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2" aria-label={t("admin.nav.viewStore")}>
              <img src="/logo.png" alt="Twisisa Market" width={24} height={24} />
              <span className="text-sm font-bold">Twisisa Admin</span>
            </Link>
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <button onClick={() => { logout(); navigate("/admin/login"); }} className="rounded-lg p-2 text-danger hover:bg-danger/10" aria-label={t("admin.logout")}>
                <LogOutIcon width={18} height={18} />
              </button>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-border px-3 py-2">
            <Link to="/" className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-ink-muted">
              <StoreNavIcon width={14} height={14} />{t("admin.nav.viewStore")}
            </Link>
            {NAV.map(({ href, key, Icon, exact }) => (
              <Link key={href} to={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${isActive(href, exact) ? "bg-ink text-bg" : "bg-elevated text-ink-muted"}`}>
                <Icon width={14} height={14} />{t(key)}
              </Link>
            ))}
          </nav>
        </header>

        <div className="hidden items-center justify-end gap-2 border-b border-border px-6 py-3 md:flex">
          <LanguageToggle />
        </div>

        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
