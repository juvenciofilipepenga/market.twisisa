import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { ACCENTS, accentVars, useAdminAccent, type AdminAccent } from "@/lib/adminTheme";
import { LanguageToggle } from "../layout/LanguageToggle";
import { Modal } from "../ui/Modal";
import { LayoutDashboardIcon, PackageNavIcon, TagsNavIcon, OrdersNavIcon, UsersNavIcon, ChatNavIcon, StoreNavIcon } from "./navIcons";
import { LogOutIcon, GridIcon } from "../icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { href: string; key: string; Icon: Icon; exact?: boolean };

const DASH: NavItem = { href: "/admin", key: "admin.nav.dashboard", Icon: LayoutDashboardIcon, exact: true };
const ORDERS: NavItem = { href: "/admin/pedidos", key: "admin.nav.orders", Icon: OrdersNavIcon };
const CHAT: NavItem = { href: "/admin/chat", key: "admin.nav.chat", Icon: ChatNavIcon };
const PRODUCTS: NavItem = { href: "/admin/produtos", key: "admin.nav.products", Icon: PackageNavIcon };
const CATEGORIES: NavItem = { href: "/admin/categorias", key: "admin.nav.categories", Icon: TagsNavIcon };
const USERS: NavItem = { href: "/admin/utilizadores", key: "admin.nav.users", Icon: UsersNavIcon };

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  { title: "admin.group.operation", items: [DASH, ORDERS, CHAT] },
  { title: "admin.group.catalog", items: [PRODUCTS, CATEGORIES] },
  { title: "admin.group.people", items: [USERS] }
];
// Telemóvel: 4 destinos de uso diário na barra + "Mais" (o resto, a cor do painel, a loja e sair).
const TABS: NavItem[] = [DASH, ORDERS, PRODUCTS, CHAT];
const MORE: NavItem[] = [CATEGORIES, USERS];

function AccentPicker({ accent, onChange, label }: { accent: AdminAccent; onChange: (id: string) => void; label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink-faint">{label}</p>
      <div className="flex gap-2.5" role="group" aria-label={label}>
        {ACCENTS.map((a) => (
          <button key={a.id} type="button" onClick={() => onChange(a.id)} aria-label={a.label} aria-pressed={a.id === accent.id} title={a.label}
            style={{ background: `rgb(${a.primary})` }}
            className={`press h-8 w-8 rounded-full ring-offset-2 ring-offset-surface ${a.id === accent.id ? "ring-2 ring-ink" : "ring-0"}`} />
        ))}
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  useDocumentMeta({ title: "Admin · Twisisa Market", noindex: true });
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [accent, setAccent] = useAdminAccent();
  const [moreOpen, setMoreOpen] = useState(false);

  // Cor do painel em <html> (os modais e avisos vivem fora do contentor) + espaço da barra inferior para avisos/chat.
  useEffect(() => {
    const root = document.documentElement;
    const vars = accentVars(accent);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => root.style.removeProperty(k));
  }, [accent]);
  useEffect(() => {
    document.documentElement.setAttribute("data-bottom-nav", "");
    return () => document.documentElement.removeAttribute("data-bottom-nav");
  }, []);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const moreActive = MORE.some(isActive);
  const roleLabel = user?.roles.includes("SUPER_ADMIN") ? t("admin.role.super") : t("admin.role.admin");
  const doLogout = () => { logout(); navigate("/admin/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-bg md:flex">
      {/* ===== Ecrã largo: barra lateral ===== */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:sticky md:top-0 md:flex md:h-screen">
        <div className="h-1 bg-primary" />
        <div className="flex items-center gap-2.5 px-4 py-4">
          <img src="/logo.png" alt="" width={32} height={32} />
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold leading-none">Twisisa</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-primary-text">{t("admin.area")}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-widest text-ink-faint">{t(g.title)}</p>
              {g.items.map((item) => (
                <Link key={item.href} to={item.href} aria-current={isActive(item) ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive(item) ? "bg-primary-soft text-ink" : "text-ink-muted hover:bg-elevated hover:text-ink"}`}>
                  <item.Icon width={18} height={18} className={isActive(item) ? "text-primary-text" : ""} />{t(item.key)}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <AccentPicker accent={accent} onChange={setAccent} label={t("admin.theme")} />
          <Link to="/" className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm font-medium text-ink-muted hover:border-primary/50 hover:text-ink">
            <StoreNavIcon width={18} height={18} />{t("admin.nav.viewStore")}
          </Link>
          <div className="px-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-ink-faint">{user?.email}</p>
            <p className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary-text">{roleLabel}</p>
          </div>
          <button onClick={doLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10">
            <LogOutIcon width={16} height={16} />{t("admin.logout")}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* ===== Telemóvel: barra de topo ===== */}
        <header className="safe-top sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur md:hidden">
          <div className="h-1 bg-primary" />
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="" width={26} height={26} />
              <span className="text-sm font-bold">Twisisa</span>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-text">Admin</span>
            </div>
            <LanguageToggle />
          </div>
        </header>

        <div className="hidden items-center justify-end gap-2 border-b border-border px-6 py-3 md:flex"><LanguageToggle /></div>

        <main className="pb-nav-6 mx-auto max-w-6xl p-4 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* ===== Telemóvel: barra inferior ===== */}
      <nav aria-label="Admin" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur md:hidden">
        <ul className="flex h-[3.75rem] items-stretch">
          {TABS.map((item) => (
            <li key={item.href} className="flex-1">
              <Link to={item.href} aria-current={isActive(item) ? "page" : undefined}
                className={`press relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive(item) ? "text-primary-text" : "text-ink-faint"}`}>
                {isActive(item) && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
                <item.Icon width={22} height={22} /><span className="max-w-full truncate px-1">{t(item.key)}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog"
              className={`press relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${moreActive ? "text-primary-text" : "text-ink-faint"}`}>
              {moreActive && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              <GridIcon width={22} height={22} /><span>{t("admin.nav.more")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <Modal title={t("admin.nav.more")} onClose={() => setMoreOpen(false)} size="sm">
          <div className="space-y-1">
            {MORE.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive(item) ? "bg-primary-soft text-ink" : "text-ink-muted hover:bg-elevated"}`}>
                <item.Icon width={20} height={20} />{t(item.key)}
              </Link>
            ))}
          </div>
          <div className="my-4 border-t border-border pt-4"><AccentPicker accent={accent} onChange={setAccent} label={t("admin.theme")} /></div>
          <Link to="/" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-ink-muted hover:bg-elevated">
            <StoreNavIcon width={20} height={20} />{t("admin.nav.viewStore")}
          </Link>
          <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-danger hover:bg-danger/10">
            <LogOutIcon width={20} height={20} />{t("admin.logout")}
          </button>
          <p className="mt-3 truncate px-3 text-xs text-ink-faint">{user?.email} · {roleLabel}</p>
        </Modal>
      )}
    </div>
  );
}
