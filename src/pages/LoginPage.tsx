import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Header } from "@/components/layout/Header";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth, ApiError } from "@/auth/AuthContext";
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
      navigate(searchParams.get("next") || "/");
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
        <h1 className="mb-6 text-xl font-bold">{t("auth.login")}</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{t("auth.submit")}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          {t("auth.noAccount")} <Link to="/registar" className="font-semibold text-primary">{t("auth.register")}</Link>
        </p>
      </div>
    </main>
  );
}
