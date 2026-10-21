import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { AdminProfileName, TeamMember } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckIcon, TrashIcon } from "@/components/icons";

const PROFILES: Array<{ id: AdminProfileName; label: string; hint: string }> = [
  { id: "ORDERS", label: "Encomendas", hint: "Encomendas e envios; vê pagamentos e clientes" },
  { id: "FINANCE", label: "Finanças", hint: "Pagamentos, comprovativos, faturas e preços" },
  { id: "CATALOG", label: "Catálogo", hint: "Produtos, categorias e características" },
  { id: "SUPPORT", label: "Suporte", hint: "Chat, IA do chat e suspensão de clientes" },
  { id: "CONTENT", label: "Conteúdo", hint: "Blog (fica ativo quando o blog existir)" }
];

const ERRORS: Record<string, string> = {
  USER_NOT_FOUND: "Não existe conta com esse e-mail. A pessoa tem de se registar primeiro, como cliente.",
  ALREADY_ADMIN: "Esta pessoa já faz parte da equipa.",
  ACCOUNT_RESTRICTED: "Esta conta está suspensa ou bloqueada.",
  FORBIDDEN: "Não é possível alterar um super administrador.",
  INVALID_INPUT: "Confirme o e-mail e os perfis."
};
function teamError(error: unknown): string {
  return error instanceof ApiError ? (ERRORS[error.code] ?? "Não foi possível concluir.") : "Sem ligação ao servidor.";
}

const chip = (active: boolean) =>
  `press min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${active ? "border-primary bg-primary text-white" : "border-border text-ink-muted hover:bg-elevated"}`;

// Equipa de administração: só o super administrador chega aqui. Cada pessoa tem os perfis que lhe derem; as permissões saem
// dos perfis (ver backend: src/lib/permissions.ts) e a API verifica-as em cada pedido, por isso retirar um perfil vale logo.
export default function AdminTeamPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newProfiles, setNewProfiles] = useState<AdminProfileName[]>([]);
  const [adding, setAdding] = useState(false);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try { setMembers((await api.admin.team.list(token)).data); setLoadError(false); }
    catch { setLoadError(true); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function toggle(member: TeamMember, profile: AdminProfileName) {
    if (!token || member.isSuper) return;
    const next = member.adminProfiles.includes(profile) ? member.adminProfiles.filter((p) => p !== profile) : [...member.adminProfiles, profile];
    setError(null);
    setMembers((previous) => previous?.map((item) => (item.id === member.id ? { ...item, adminProfiles: next } : item)) ?? previous);
    try { await api.admin.team.setProfiles(token, member.id, next); }
    catch (err) { setError(teamError(err)); await load(); }
  }

  async function add() {
    if (!token || !email.trim() || adding) return;
    setAdding(true); setError(null);
    try {
      await api.admin.team.add(token, { email: email.trim(), profiles: newProfiles });
      setEmail(""); setNewProfiles([]);
      await load();
    } catch (err) { setError(teamError(err)); }
    finally { setAdding(false); }
  }

  if (!token) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-lg font-bold">Equipa</h1>
        <p className="mt-1 text-xs text-ink-muted">Cada pessoa vê e faz só o que os seus perfis permitem. Quem ficar sem perfis entra no painel mas não vê nenhuma área.</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">{error}</p>}

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <p className="text-sm font-bold">Adicionar à equipa</p>
        <label htmlFor="team-email" className="block text-xs font-semibold text-ink-muted">E-mail da conta (já registada na loja)</label>
        <input id="team-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Perfis">
          {PROFILES.map((profile) => (
            <button key={profile.id} type="button" title={profile.hint} aria-pressed={newProfiles.includes(profile.id)} onClick={() => setNewProfiles((previous) => (previous.includes(profile.id) ? previous.filter((p) => p !== profile.id) : [...previous, profile.id]))} className={chip(newProfiles.includes(profile.id))}>{profile.label}</button>
          ))}
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => void add()} disabled={!email.trim() || adding} className="press flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40" aria-label="Adicionar à equipa" title="Adicionar à equipa"><CheckIcon width={20} height={20} /></button>
        </div>
      </section>

      {loadError && <p role="alert" className="rounded-xl border border-border p-4 text-sm text-danger">Não foi possível carregar a equipa.</p>}
      {members === null && !loadError && <Skeleton className="h-32 w-full" />}
      {members?.map((member) => (
        <article key={member.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{member.name}{member.isSuper && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">Super administrador</span>}</p>
              <p className="truncate text-xs text-ink-muted">{member.email}</p>
            </div>
            {!member.isSuper && (
              <button type="button" onClick={() => setToRemove(member)} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-elevated" aria-label={`Retirar ${member.name} da equipa`} title="Retirar da equipa"><TrashIcon width={17} height={17} /></button>
            )}
          </div>
          {member.isSuper
            ? <p className="text-xs text-ink-muted">Tem acesso a tudo, incluindo esta página.</p>
            : <div className="flex flex-wrap gap-2" role="group" aria-label={`Perfis de ${member.name}`}>
                {PROFILES.map((profile) => (
                  <button key={profile.id} type="button" title={profile.hint} aria-pressed={member.adminProfiles.includes(profile.id)} onClick={() => void toggle(member, profile.id)} className={chip(member.adminProfiles.includes(profile.id))}>{profile.label}</button>
                ))}
              </div>}
        </article>
      ))}

      {toRemove && (
        <ConfirmDialog
          title="Retirar da equipa"
          message={`${toRemove.name} deixa de ter acesso ao painel. A conta continua como cliente.`}
          confirmLabel="Retirar"
          danger
          onConfirm={async () => { if (!token) return; await api.admin.team.remove(token, toRemove.id); setToRemove(null); await load(); }}
          onClose={() => setToRemove(null)}
        />
      )}
    </div>
  );
}
