import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { GiftIcon } from "@/components/icons";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth, ApiError } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const { t } = useLocale();
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
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="mb-6 text-xl font-bold">{t("auth.register")}</h1>
        {inviter && (
          <p className="rise mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3 text-sm text-ink">
            <GiftIcon width={20} height={20} className="shrink-0 text-primary-text" />
            <span>{t("auth.invitedBy")} <strong>{inviter}</strong></span>
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("auth.phone")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input required type="password" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{t("auth.submit")}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          {t("auth.hasAccount")} <Link to="/entrar" className="font-semibold text-primary">{t("auth.login")}</Link>
        </p>
      </div>
    </main>
  );
}
