import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth, ApiError } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const { t } = useLocale();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      const admin = user.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN");
      if (!admin) {
        logout();
        setError("Esta conta não tem acesso administrativo.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.code : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Twisisa Market" width={44} height={44} />
          <h1 className="text-lg font-bold">{t("admin.login.title")}</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")}
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")}
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{t("auth.submit")}</Button>
        </form>
      </div>
    </div>
  );
}
