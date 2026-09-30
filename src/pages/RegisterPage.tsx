import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { GiftIcon } from "@/components/icons";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useAuth } from "@/auth/AuthContext";
import { friendlyError, safeNext } from "@/lib/errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, PasswordField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: `${t("auth.register")} · Twisisa Market`, noindex: true });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref")?.trim() || undefined;
  const [inviter, setInviter] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Confirma o código do link e mostra quem convidou; se for inválido, o registo segue normalmente sem convite.
  useEffect(() => {
    if (!refCode) return;
    let active = true;
    api.referrals.lookup(refCode).then((r) => { if (active) setInviter(r.inviterFirstName); }).catch(() => { if (active) setInviter(null); });
    return () => { active = false; };
  }, [refCode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password, phone || undefined, inviter ? refCode : undefined);
      navigate(safeNext(searchParams.get("next")), { replace: true });
    } catch (err) {
      setError(friendlyError(err, t));
      setLoading(false);
    }
  }

  const next = searchParams.get("next");
  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSub")}
      footer={<>{t("auth.hasAccount")} <Link to={next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar"} className="font-semibold text-primary-text hover:text-ink">{t("auth.login")}</Link></>}
    >
      {inviter && (
        <p className="rise mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3 text-sm text-ink">
          <GiftIcon width={20} height={20} className="shrink-0 text-primary-text" />
          <span>{t("auth.invitedBy")} <strong>{inviter}</strong></span>
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t("auth.name")} required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label={t("auth.email")} required type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label={t("auth.phone")} type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <PasswordField label={t("auth.password")} required minLength={10} autoComplete="new-password" hint={t("auth.passwordHint")} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>{t("auth.submit")}</Button>
      </form>
    </AuthShell>
  );
}
