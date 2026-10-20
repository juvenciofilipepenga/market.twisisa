import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { getLocalAvatar } from "@/lib/avatar";
import type { Me, ReferralInfo } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { BoxIcon, ChevronRightIcon, GiftIcon, LogOutIcon, SettingsIcon, UserIcon, CheckIcon, ShieldIcon, WalletIcon, UserPlusIcon } from "@/components/icons";

function MenuRow({ to, icon, title, detail, trailing }: { to: string; icon: ReactNode; title: string; detail?: string; trailing?: ReactNode }) {
  return (
    <Link to={to} className="profile-menu-row press group flex min-h-[70px] items-center gap-3 border-b border-border/80 px-1 py-3 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        {detail && <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{detail}</span>}
      </span>
      {trailing}
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="profile-detail-row flex min-w-0 items-start justify-between gap-4 py-3.5">
    <span className="shrink-0 text-sm text-ink-muted">{label}</span>
    <span className="min-w-0 break-words text-right text-sm font-semibold">{value}</span>
  </div>;
}

export default function ProfilePage() {
  const { t, locale } = useLocale();
  useDocumentMeta({ title: `${t("profile.title")} · Twisisa Market`, noindex: true });
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purchaseCount, setPurchaseCount] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api.users.me(token).then((data) => {
      setMe(data); setName(data.name); setPhone(data.phone ?? ""); setPhoto(data.avatarUrl ?? getLocalAvatar(data.id));
    }).catch(() => { /* 401 já é tratado globalmente */ });
    api.referrals.me(token).then(setReferral).catch(() => setReferral(null));
    api.orders.list(token, { page: 1, limit: 1 }).then((result) => setPurchaseCount(result.pagination.total)).catch(() => setPurchaseCount(null));
  }, [token]);

  async function saveProfile() {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      await api.users.updateMe(token, { name: name.trim(), phone: phone.trim() || null });
      setMe((current) => current ? { ...current, name: name.trim(), phone: phone.trim() || null } : current);
      setEditing(false);
      toast.show(t("toast.saved"), { key: "profile" });
    } catch {
      toast.show(t("common.error"), { tone: "error", key: "profile" });
    } finally { setSaving(false); }
  }

  function onLogout() {
    logout();
    toast.show(t("toast.loggedOut"));
    navigate("/", { replace: true });
  }

  const since = me ? new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(me.createdAt)) : null;
  const completed = referral?.completedReferrals ?? 0;
  const invited = referral?.invitedReferrals ?? (completed + (referral?.pendingReferrals ?? 0));

  return (
    <main className="min-h-screen pb-8">
      <Header />
      <div className="profile-enter mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-text">TWISISA MARKET</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">A minha conta</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie o seu perfil, compras e benefícios.</p>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-[76px] w-[76px] shrink-0">
              {token && <AvatarEditor name={me?.name ?? ""} photo={photo} token={token} userId={me?.id ?? ""} onChange={setPhoto} />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-text"><CheckIcon width={12} height={12} /> Cliente Twisisa</span>
              <h2 className="mt-2 break-words text-lg font-extrabold leading-tight">{me?.name ?? <Skeleton className="h-6 w-36" />}</h2>
              <p className="mt-1 break-all text-sm text-ink-muted">{me?.email ?? "A carregar conta…"}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="rounded-xl bg-elevated p-3">
              <span className="flex items-center gap-2 text-xs text-ink-muted"><BoxIcon width={16} height={16} /> Compras registadas</span>
              <p className="mt-1 text-2xl font-extrabold">{purchaseCount === null ? "—" : purchaseCount}</p>
            </div>
            <div className="rounded-xl bg-elevated p-3">
              <span className="flex items-center gap-2 text-xs text-ink-muted"><UserPlusIcon width={16} height={16} /> Convites concluídos</span>
              <p className="mt-1 text-2xl font-extrabold">{referral ? completed : "—"}</p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[.15em] text-ink-faint">Benefícios e actividade</h2>
          <div className="rounded-2xl border border-border bg-surface px-4">
            <MenuRow to="/convites" icon={<GiftIcon width={20} height={20} />} title="Convide e ganhe" detail={referral ? `${completed} compras concluídas${invited > completed ? ` · ${invited - completed} por concluir` : ""}. Consulte o seu código de convite.` : "Partilhe o seu convite e acompanhe os resultados."} />
            <MenuRow to="/pedidos" icon={<BoxIcon width={20} height={20} />} title="As minhas encomendas" detail="Consulte compras anteriores e acompanhe entregas." trailing={purchaseCount !== null ? <span className="rounded-full bg-elevated px-2 py-1 text-xs font-bold text-ink-muted">{purchaseCount}</span> : undefined} />
            <div className="flex min-h-[70px] items-center gap-3 border-b border-border/80 py-3 last:border-b-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text"><WalletIcon width={20} height={20} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Pontos e créditos</span><span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">Benefícios para futuras compras e descontos.</span></span>
              <span className="shrink-0 rounded-full bg-elevated px-2 py-1 text-[10px] font-bold text-ink-muted">Benefícios</span>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-[.15em] text-ink-faint">Conta e preferências</h2>
          <div className="rounded-2xl border border-border bg-surface px-4">
            <div className="divide-y divide-border/80">
              <DetailRow label="Email" value={me?.email ?? "A carregar…"} />
              <DetailRow label="Cliente desde" value={since ?? "—"} />
              <div className="flex items-center justify-between gap-4 py-3.5"><span className="text-sm text-ink-muted">Estado da conta</span><span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-success" />Ativa</span></div>
            </div>
            <div className="border-t border-border">
              <button type="button" aria-expanded={editing} onClick={() => setEditing((value) => !value)} className="press flex min-h-[66px] w-full items-center gap-3 py-3 text-left transition-colors hover:bg-elevated">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-ink-muted"><UserIcon width={20} height={20} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Dados pessoais</span><span className="mt-0.5 block text-xs text-ink-muted">Nome e número de telefone</span></span>
                <ChevronRightIcon width={19} height={19} className={`text-ink-faint transition-transform duration-200 ${editing ? "rotate-90" : ""}`} />
              </button>
              {editing && <div className="profile-expand border-t border-border py-4"><div className="space-y-3">
                <Field label={t("auth.name")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                <Field label={t("auth.email")} value={me?.email ?? ""} disabled readOnly />
                <Field label={t("auth.phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="flex gap-2 pt-1"><Button variant="secondary" className="flex-1" onClick={() => { setName(me?.name ?? ""); setPhone(me?.phone ?? ""); setEditing(false); }}>Cancelar</Button><Button className="flex-1" onClick={saveProfile} disabled={!name.trim() || saving}>{saving ? "A guardar…" : t("common.save")}</Button></div>
              </div></div>}
            </div>
          </div>
        </section>

        {isAdmin && <div className="mt-4"><Link to="/admin" className="press flex min-h-12 items-center gap-3 rounded-xl border border-primary/25 px-4 text-sm font-semibold text-primary-text transition-colors hover:bg-primary-soft"><ShieldIcon width={18} height={18} /><span className="flex-1">Área de administração</span><ChevronRightIcon width={18} height={18} /></Link></div>}
        <button type="button" onClick={onLogout} className="press mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"><LogOutIcon width={18} height={18} />{t("profile.logout")}</button>
      </div>
    </main>
  );
}
