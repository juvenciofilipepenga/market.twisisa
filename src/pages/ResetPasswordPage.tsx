import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { recoverError, resetBlockReason, type ResetBlock } from "@/lib/errors";
import { formatClock } from "@/lib/clock";
import { isPasswordAcceptable, PASSWORD_MAX } from "@/lib/passwordRules";
import { useCountdown } from "@/lib/useCountdown";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordMeter } from "@/components/auth/PasswordMeter";
import { PasswordField } from "@/components/ui/Field";
import { Button, buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CheckIcon, ShieldIcon, XIcon } from "@/components/icons";

type View =
  | { kind: "checking" }
  | { kind: "ready"; email: string; expiresAt: string; serverNow: string }
  | { kind: "blocked"; reason: ResetBlock }
  | { kind: "offline" }
  | { kind: "done"; signedIn: boolean };

const WARN_SECONDS = 120;

export default function ResetPasswordPage() {
  const { t } = useLocale();
  useDocumentMeta({ title: `${t("reset.title")} · Twisisa Market`, noindex: true });
  const { acceptSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [view, setView] = useState<View>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    if (!token) { setView({ kind: "blocked", reason: "invalid" }); return; }
    try {
      const res = await api.auth.checkReset(token);
      setView((cur) => cur.kind === "done" ? cur : { kind: "ready", email: res.email, expiresAt: res.expiresAt, serverNow: res.serverNow ?? new Date().toISOString() });
    } catch (err) {
      const reason = resetBlockReason(err);
      setView((cur) => {
        if (cur.kind === "done") return cur;
        if (reason) return { kind: "blocked", reason };
        return cur.kind === "ready" ? cur : { kind: "offline" };
      });
    }
  }, [token]);

  useEffect(() => { void verify(); }, [verify]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") void verify(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [verify]);

  useEffect(() => {
    if (view.kind !== "done") return;
    const id = window.setTimeout(() => navigate(view.signedIn ? "/" : "/entrar", { replace: true }), 1600);
    return () => window.clearTimeout(id);
  }, [view, navigate]);

  const left = useCountdown(view.kind === "ready" ? view.expiresAt : null, view.kind === "ready" ? view.serverNow : null);
  const seconds = left === null ? null : Math.ceil(left / 1000);
  const current: View = view.kind === "ready" && seconds === 0 ? { kind: "blocked", reason: "expired" } : view;

  const match = confirm.length > 0 && confirm === password;
  const diverged = confirm.length > 0 && !password.startsWith(confirm);
  const canSubmit = isPasswordAcceptable(password) && match;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setFieldError(null);
    try {
      const res = await api.auth.reset(token, password);
      if (res.accessToken) acceptSession(res.user, res.accessToken);
      setView({ kind: "done", signedIn: Boolean(res.accessToken) });
    } catch (err) {
      const reason = resetBlockReason(err);
      if (reason) setView({ kind: "blocked", reason });
      else if (err instanceof ApiError && err.code === "SAME_PASSWORD") setFieldError(t("reset.same"));
      else setError(recoverError(err, t));
      setLoading(false);
    }
  }

  if (current.kind === "checking") {
    return (
      <AuthShell title={t("reset.title")}>
        <p className="flex items-center gap-3 text-sm text-ink-muted"><Spinner size={20} /> {t("reset.checking")}</p>
      </AuthShell>
    );
  }

  if (current.kind === "offline") {
    return (
      <AuthShell title={t("reset.title")}>
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{t("reset.offline")}</p>
        <Button variant="secondary" size="lg" className="mt-4 w-full" onClick={verify}>{t("common.retry")}</Button>
      </AuthShell>
    );
  }

  if (current.kind === "blocked") {
    const restricted = current.reason === "restricted";
    return (
      <AuthShell title={t(`reset.${current.reason}.title`)}>
        <div className="rise rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/30">
          <span className="pop mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            {restricted ? <ShieldIcon width={24} height={24} /> : <XIcon width={24} height={24} />}
          </span>
          <p className="text-sm leading-relaxed text-ink-muted">{t(`reset.${current.reason}.body`)}</p>
        </div>
        <Link to={restricted ? "/" : "/recuperar"} className={buttonClass("primary", "lg", "mt-4 w-full")}>
          {restricted ? t("notFound.cta") : t("reset.requestNew")}
        </Link>
      </AuthShell>
    );
  }

  if (current.kind === "done") {
    return (
      <AuthShell title={t("reset.doneTitle")}>
        <div className="rise rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/30">
          <span className="pop mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckIcon width={24} height={24} />
          </span>
          <p className="text-sm leading-relaxed text-ink-muted">{current.signedIn ? t("reset.doneSignedIn") : t("reset.doneLogin")}</p>
        </div>
      </AuthShell>
    );
  }

  const urgent = seconds !== null && seconds <= WARN_SECONDS;
  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subFor").replace("{email}", current.email)}>
      {seconds !== null && (
        <p className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-300 ${urgent ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-elevated text-ink-muted"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-warning" : "bg-success"}`} aria-hidden="true" />
          {t("reset.expiresIn").replace("{time}", formatClock(seconds))}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <PasswordField
            label={t("reset.newPassword")}
            required
            autoFocus
            maxLength={PASSWORD_MAX}
            autoComplete="new-password"
            value={password}
            error={fieldError}
            onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
          />
          <PasswordMeter password={password} />
        </div>
        <PasswordField
          label={t("reset.confirm")}
          required
          maxLength={PASSWORD_MAX}
          autoComplete="new-password"
          value={confirm}
          error={diverged ? t("reset.noMatch") : null}
          hint={match ? t("reset.match") : undefined}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!canSubmit}>{t("reset.submit")}</Button>
      </form>
    </AuthShell>
  );
}
