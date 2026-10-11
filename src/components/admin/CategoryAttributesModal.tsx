import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { adminError } from "@/lib/errors";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/LocaleContext";
import type { AttributeType, Category, CategoryAttribute } from "@/lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { PlusIcon, TrashIcon } from "../icons";
import { inputCls, Labeled, Switch } from "./product/Section";

const TYPE_LABEL: Record<AttributeType, string> = { TEXT: "Texto", NUMBER: "Número", BOOLEAN: "Sim / Não", SELECT: "Lista de valores", MEASURE: "Medida (com unidade)" };

interface Draft { name: string; type: AttributeType; unit: string; options: string; required: boolean; showPublic: boolean; filterable: boolean; sortOrder: string }
const emptyDraft = (order: number): Draft => ({ name: "", type: "TEXT", unit: "", options: "", required: false, showPublic: true, filterable: false, sortOrder: String(order) });
const draftOf = (a: CategoryAttribute): Draft => ({ name: a.name, type: a.type, unit: a.unit ?? "", options: a.options.join("\n"), required: a.required, showPublic: a.showPublic, filterable: a.filterable, sortOrder: String(a.sortOrder) });

// O administrador define, por categoria, as características técnicas (Marca, RAM, Material…). Nada fica fixo no código.
export function CategoryAttributesModal({ category, onClose }: { category: Category; onClose: () => void }) {
  const { token } = useAuth();
  const { t } = useLocale();
  const [list, setList] = useState<CategoryAttribute[] | null>(null);
  const [editing, setEditing] = useState<CategoryAttribute | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(0));
  const [deleting, setDeleting] = useState<CategoryAttribute | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.admin.categoryAttributes.list(token, category.id).then(setList).catch((err) => { setList([]); setError(adminError(err, t)); });
  }, [token, category.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const startNew = () => { setDraft(emptyDraft((list?.length ?? 0) + 1)); setEditing("new"); setError(null); };
  const startEdit = (a: CategoryAttribute) => { setDraft(draftOf(a)); setEditing(a); setError(null); };

  async function save() {
    if (!token || !editing) return;
    const options = draft.options.split("\n").map((o) => o.trim()).filter(Boolean);
    if (draft.name.trim().length < 2) { setError("Escreva o nome da característica."); return; }
    if (draft.type === "SELECT" && options.length === 0) { setError("Escreva pelo menos um valor da lista (um por linha)."); return; }
    setSaving(true);
    setError(null);
    try {
      const common = { name: draft.name.trim(), required: draft.required, showPublic: draft.showPublic, filterable: draft.filterable, sortOrder: Number(draft.sortOrder) || 0 };
      if (editing === "new") {
        const created = await api.admin.categoryAttributes.create(token, category.id, { ...common, type: draft.type, unit: draft.type === "MEASURE" ? draft.unit.trim() || null : null, options: draft.type === "SELECT" ? options : undefined });
        setList((prev) => [...(prev ?? []), created].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      } else {
        const updated = await api.admin.categoryAttributes.update(token, editing.id, { ...common, unit: editing.type === "MEASURE" ? draft.unit.trim() || null : undefined, options: editing.type === "SELECT" ? options : undefined });
        setList((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
      }
      setEditing(null);
    } catch (err) {
      setError(adminError(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!token || !deleting) return;
    setSaving(true);
    try {
      await api.admin.categoryAttributes.remove(token, deleting.id);
      setList((prev) => (prev ?? []).filter((a) => a.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(adminError(err, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Características · ${category.name}`} onClose={onClose} size="lg">
      <p className="mb-4 text-sm text-ink-muted">Defina o que se pode preencher nos produtos desta categoria (por exemplo Marca, RAM, Material). Aparecem no formulário do produto e na página pública.</p>

      {error && <p role="alert" className="mb-3 rounded-xl bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">{error}</p>}

      {!editing && (
        <>
          {list === null && <p className="text-sm text-ink-faint">A carregar…</p>}
          {list?.length === 0 && <p className="rounded-xl bg-elevated px-3 py-3 text-sm text-ink-muted">Ainda não há características nesta categoria.</p>}
          <ul className="space-y-2">
            {list?.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => startEdit(a)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{a.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{TYPE_LABEL[a.type]}{a.type === "MEASURE" && a.unit ? ` · ${a.unit}` : ""}{a.type === "SELECT" ? ` · ${a.options.length} valores` : ""}</p>
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      {a.required && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">Obrigatória</span>}
                      {a.showPublic ? <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-ink-muted">Visível na loja</span> : <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-ink-faint">Só admin</span>}
                      {a.filterable && <span className="rounded-full bg-elevated px-2 py-0.5 text-[11px] text-ink-muted">Filtro</span>}
                    </p>
                  </button>
                  <Button size="icon" variant="ghost" aria-label={`Apagar ${a.name}`} onClick={() => setDeleting(a)}><TrashIcon width={16} height={16} /></Button>
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" variant="secondary" onClick={startNew}><PlusIcon width={16} height={16} />Adicionar característica</Button>
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <Labeled label="Nome" required><input autoFocus value={draft.name} maxLength={60} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Memória RAM" className={inputCls} /></Labeled>
          <Labeled label="Tipo de valor" hint={editing !== "new" ? "O tipo não se muda depois de criado." : undefined}>
            <select value={draft.type} disabled={editing !== "new"} onChange={(e) => set("type", e.target.value as AttributeType)} className={`${inputCls} disabled:opacity-60`}>
              {(Object.keys(TYPE_LABEL) as AttributeType[]).map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}
            </select>
          </Labeled>
          {draft.type === "MEASURE" && <Labeled label="Unidade" hint="Ex.: GB, kg, polegadas."><input value={draft.unit} maxLength={12} onChange={(e) => set("unit", e.target.value)} className={inputCls} /></Labeled>}
          {draft.type === "SELECT" && <Labeled label="Valores possíveis" hint="Um por linha."><textarea rows={4} value={draft.options} onChange={(e) => set("options", e.target.value)} className={inputCls} /></Labeled>}
          <Switch checked={draft.required} onChange={(v) => set("required", v)} label="Obrigatória" help="O produto não pode ser publicado sem esta característica." />
          <Switch checked={draft.showPublic} onChange={(v) => set("showPublic", v)} label="Mostrar na página do produto" />
          <Switch checked={draft.filterable} onChange={(v) => set("filterable", v)} label="Usar em filtros" help="Para pesquisar produtos por esta característica." />
          <Labeled label="Ordem de apresentação"><input type="number" min={0} inputMode="numeric" value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className={inputCls} /></Labeled>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => { setEditing(null); setError(null); }}>{t("common.cancel")}</Button>
            <Button className="flex-1" loading={saving} onClick={save}>{t("common.save")}</Button>
          </div>
        </div>
      )}

      {deleting && (
        <Modal title="Apagar característica" size="sm" onClose={() => setDeleting(null)}>
          <p className="text-sm text-ink-muted">Apagar <strong>{deleting.name}</strong>? Os valores já preenchidos nos produtos também são apagados.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleting(null)}>{t("common.cancel")}</Button>
            <Button className="flex-1" loading={saving} onClick={confirmDelete}>Apagar</Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
