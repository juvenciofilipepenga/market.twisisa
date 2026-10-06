import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth, ApiError } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { SpeedLines } from "@/components/brand/SpeedLines";
import { img } from "@/lib/images";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

const input = "w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm placeholder:text-ink-faint focus:border-ink-faint focus:outline-none";

export default function AdminLoginPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: "Admin · Twisisa Market", noindex: true });
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
        setError(t("admin.login.noAccess"));
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.status === 401 ? t("auth.invalidCredentials") : err.code);
      else setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary-active lg:flex lg:flex-col lg:justify-between">
        <SpeedLines className="pointer-events-none absolute -left-10 top-16 h-56 w-80 text-white/15" />
        <p className="relative max-w-sm px-12 pt-14 font-display text-4xl font-extrabold leading-[1.1] text-white">{t("admin.login.side")}</p>
        <img src={img.shield} alt="" width={700} height={847} className="relative mx-auto mb-16 h-56 object-contain drop-shadow-2xl" />
      </aside>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo.png" alt="Twisisa Market" width={44} height={44} />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary-text">{t("admin.area")}</p>
              <h1 className="text-2xl font-bold">{t("admin.login.title")}</h1>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-muted">{t("auth.email")}</span>
              <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-muted">{t("auth.password")}</span>
              <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </label>
            {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full py-3" disabled={loading}>{loading ? t("common.loading") : t("auth.submit")}</Button>
          </form>
          <Link to="/" className="mt-6 inline-block text-sm text-ink-muted hover:text-ink">{t("admin.login.back")}</Link>
        </div>
      </div>
    </div>
  );
}
