import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import { adminError, labelOr } from "@/lib/errors";
import type { AdminUser, UserStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionMenu, type MenuItem } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { UsersNavIcon } from "@/components/admin/navIcons";

const PAGE_SIZE = 20;

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success", PENDING: "warning", SUSPENDED: "warning", BLOCKED: "danger"
};

type Target = "SUSPENDED" | "BLOCKED";

export default function AdminUsersPage() {
  const { token, user: me } = useAuth();
  const { t } = useLocale();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ user: AdminUser; status: Target } | null>(null);

  const iAmSuper = Boolean(me?.roles.includes("SUPER_ADMIN"));

  const load = useCallback(() => {
    if (!token) return Promise.resolve();
    return api.admin.users.list(token, { search: search || undefined, page, limit: PAGE_SIZE })
      .then((r) => { setUsers(r.data); setTotal(r.pagination.total); })
      .catch((err) => { setUsers([]); setError(adminError(err, t)); });
  }, [token, search, page, t]);

  useEffect(() => {
    if (!token) return;
    setUsers(null);
    setError(null);
    const timeout = setTimeout(() => { void load(); }, 250);
    return () => clearTimeout(timeout);
  }, [token, load]);

  // Muda o estado e actualiza só essa linha (sem recarregar a lista inteira). Lança em caso de erro: o ConfirmDialog mostra-o.
  async function applyStatus(user: AdminUser, status: UserStatus) {
    if (!token) return;
    await api.admin.users.setStatus(token, user.id, status as "ACTIVE" | "SUSPENDED" | "BLOCKED");
    setUsers((current) => current?.map((u) => (u.id === user.id ? { ...u, status } : u)) ?? null);
    toast.show(t("admin.users.updated"), { tone: "success", key: "user-status" });
  }

  async function reactivate(user: AdminUser) {
    try {
      await applyStatus(user, "ACTIVE");
    } catch (err) {
      toast.show(adminError(err, t), { tone: "error", key: "user-status" });
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">{t("admin.nav.users")}</h1>
      <p className="mb-4 text-xs text-ink-faint">{t("admin.users.readonly")}</p>

      {error && <p role="alert" className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

      <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("admin.users.search")} aria-label={t("admin.users.search")}
        className="mb-4 w-full max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" />

      {users === null && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
      {users !== null && users.length === 0 && <EmptyState title={t("catalog.empty")} icon={<UsersNavIcon width={24} height={24} />} />}

      {users !== null && users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => {
            const roles = u.roles.map((r) => r.role.name);
            const isMe = u.id === me?.id;
            const targetIsAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
            // O backend já recusa estes casos; aqui não se mostram botões que só dariam erro.
            const locked = isMe || (targetIsAdmin && !iAmSuper);
            const items: MenuItem[] = u.status === "ACTIVE" || u.status === "PENDING"
              ? [
                  { key: "suspend", label: t("admin.users.suspend"), onSelect: () => setConfirm({ user: u, status: "SUSPENDED" }) },
                  { key: "block", label: t("admin.users.block"), danger: true, onSelect: () => setConfirm({ user: u, status: "BLOCKED" }) }
                ]
              : [{ key: "reactivate", label: t("admin.users.reactivate"), onSelect: () => { void reactivate(u); } }];
            return (
              <div key={u.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}{isMe && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary-text">{t("admin.users.you")}</span>}</p>
                  <p className="truncate text-xs text-ink-faint">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={statusTone[u.status] ?? "neutral"}>{labelOr(t, `admin.userStatus.${u.status}`, u.status)}</Badge>
                    <span className="text-xs text-ink-faint">{roles.map((r) => labelOr(t, `admin.roleName.${r}`, r)).join(", ")}</span>
                  </div>
                  {!isMe && targetIsAdmin && !iAmSuper && <p className="mt-1 text-[11px] text-ink-faint">{t("admin.users.superOnly")}</p>}
                </div>
                {!locked && <ActionMenu label={`${t("admin.users.menu")}: ${u.name}`} items={items} />}
              </div>
            );
          })}
        </div>
      )}

      {users !== null && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
          <button aria-label={t("common.previous")} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="flex h-10 w-10 items-center justify-center disabled:opacity-30">←</button>
          <span>{page} / {totalPages}</span>
          <button aria-label={t("common.next")} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="flex h-10 w-10 items-center justify-center disabled:opacity-30">→</button>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={`${t(confirm.status === "BLOCKED" ? "admin.users.block" : "admin.users.suspend")}: ${confirm.user.name}`}
          message={t(confirm.status === "BLOCKED" ? "admin.users.confirmBlock" : "admin.users.confirmSuspend")}
          confirmLabel={t(confirm.status === "BLOCKED" ? "admin.users.block" : "admin.users.suspend")}
          danger={confirm.status === "BLOCKED"}
          onClose={() => setConfirm(null)}
          onConfirm={async () => { await applyStatus(confirm.user, confirm.status); setConfirm(null); }}
        />
      )}
    </div>
  );
}
