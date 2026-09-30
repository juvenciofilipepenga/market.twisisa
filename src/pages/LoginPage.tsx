import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { friendlyError, safeNext } from "@/lib/errors";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field, PasswordField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { t } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(safeNext(searchParams.get("next")), { replace: true });
    } catch (err) {
      setError(friendlyError(err, t));
      setLoading(false);
    }
  }

  const next = searchParams.get("next");
  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSub")}
      footer={<>{t("auth.noAccount")} <Link to={next ? `/registar?next=${encodeURIComponent(next)}` : "/registar"} className="font-semibold text-primary-text hover:text-ink">{t("auth.register")}</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        <Field label={t("auth.email")} required type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label={t("auth.password")} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>{t("auth.submit")}</Button>
      </form>
    </AuthShell>
  );
}
