import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersNavIcon } from "@/components/admin/navIcons";

const PAGE_SIZE = 20;

const statusTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success", PENDING: "warning", SUSPENDED: "warning", BLOCKED: "danger"
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!token) return;
    setUsers(null);
    const timeout = setTimeout(() => {
      api.admin.users.list(token, { search: search || undefined, page, limit: PAGE_SIZE })
        .then((r) => { setUsers(r.data); setTotal(r.pagination.total); });
    }, 250);
    return () => clearTimeout(timeout);
  }, [token, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">{t("admin.nav.users")}</h1>
      <p className="mb-4 text-xs text-ink-faint">{t("admin.users.readonly")}</p>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("admin.users.search")}
        className="mb-4 w-full max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" />

      {users === null && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
      {users !== null && users.length === 0 && <EmptyState title={t("catalog.empty")} icon={<UsersNavIcon width={24} height={24} />} />}

      {users !== null && users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.name}</p>
                <p className="truncate text-xs text-ink-faint">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                <p className="text-xs text-ink-faint">{u.roles.map((r) => r.role.name).join(", ")}</p>
              </div>
              <Badge tone={statusTone[u.status] ?? "neutral"}>{u.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {users !== null && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-muted">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30">←</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30">→</button>
        </div>
      )}
    </div>
  );
}
