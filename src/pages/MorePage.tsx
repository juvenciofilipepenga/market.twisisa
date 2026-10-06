import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button, buttonClass } from "@/components/ui/Button";
import { ChevronRightIcon, LogOutIcon } from "@/components/icons";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { MORE_GROUPS, MORE_ITEMS, type MoreItem } from "@/config/more";
import { openChat } from "@/lib/chatBus";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

const row = "press flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated";

function Row({ item }: { item: MoreItem }) {
  const { t } = useLocale();
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-elevated text-primary-text"><item.Icon width={18} height={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{t(item.labelKey)}</span>
        {item.descKey && <span className="block truncate text-xs text-ink-faint">{t(item.descKey)}</span>}
      </span>
      <ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-faint" />
    </>
  );
  return item.to
    ? <Link to={item.to} className={row}>{content}</Link>
    : <button type="button" onClick={() => { if (item.action === "openChat") openChat(); }} className={row}>{content}</button>;
}

// Centro de acesso a tudo o que não cabe na barra inferior. O conteúdo vem de config/more.ts.
export default function MorePage() {
  const { t } = useLocale();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  useDocumentMeta({ title: `${t("nav.more")} · Twisisa Market`, noindex: true });

  const groups = MORE_GROUPS
    .map((group) => ({ ...group, items: MORE_ITEMS.filter((item) => item.group === group.id && (item.audience === "any" || token)) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-4">
        <h1 className="mb-4 text-2xl font-bold">{t("nav.more")}</h1>

        {/* Visitante e cliente veem coisas diferentes logo no topo */}
        {token && user ? (
          <Link to="/perfil" className="press mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-ink-faint">{user.email}</span>
            </span>
            <ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-faint" />
          </Link>
        ) : (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
            <p className="font-semibold">{t("more.guest.title")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("more.guest.body")}</p>
            <div className="mt-3 flex gap-2">
              <Link to="/entrar" className={buttonClass("primary", "md", "flex-1")}>{t("auth.login")}</Link>
              <Link to="/registar" className={buttonClass("secondary", "md", "flex-1")}>{t("auth.register")}</Link>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`more-${group.id}`}>
              <h2 id={`more-${group.id}`} className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-ink-faint">{t(group.titleKey)}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {group.items.map((item) => <Row key={item.id} item={item} />)}
              </div>
            </section>
          ))}
        </div>

        {token && (
          <Button variant="secondary" className="mt-8 w-full" onClick={() => { logout(); navigate("/", { replace: true }); }}>
            <LogOutIcon width={16} height={16} />{t("profile.logout")}
          </Button>
        )}
      </main>
    </div>
  );
}
