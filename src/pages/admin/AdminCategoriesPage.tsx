import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TagIcon, PlusIcon } from "@/components/icons";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { t } = useLocale();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() { api.categories.list().then(setCategories).catch(() => setCategories([])); }
  useEffect(reload, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.admin.categories.create(token, name.trim());
      setName("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.code : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{t("admin.nav.categories")}</h1>

      <form onSubmit={onSubmit} className="mb-5 flex max-w-sm gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        <Button type="submit" loading={saving}><PlusIcon width={16} height={16} />{t("common.create")}</Button>
      </form>
      {error && <p className="mb-3 text-xs text-danger">{error}</p>}

      {categories === null && <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full max-w-sm" />)}</div>}
      {categories !== null && (
        <div className="max-w-sm space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
              <TagIcon width={16} height={16} className="text-ink-faint" />
              <span className="text-sm">{c.name}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 max-w-sm text-xs text-ink-faint">
        O backend ainda não expõe edição/remoção de categorias (só criação) — por isso essas acções não aparecem aqui.
      </p>
    </div>
  );
}
