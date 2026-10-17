import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { recoverError } from "@/lib/errors";
import { formatClock } from "@/lib/clock";
import { isEmail } from "@/lib/passwordRules";
import { useDebounced } from "@/lib/useDebounced";
import { useResendTimer } from "@/lib/useResendTimer";
import { useLocale } from "@/i18n/LocaleContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, MailIcon } from "@/components/icons";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const toast = useToast();
  useDocumentMeta({ title: `${t("recover.title")} · Twisisa Market`, noindex: true });
  const [params] = useSearchParams();
  const timer = useResendTimer();

  const [email, setEmail] = useState(timer.email ?? params.get("email") ?? "");
  const [sentTo, setSentTo] = useState<string | null>(timer.email);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const settled = useDebounced(email, 500);

  const valid = isEmail(email);
  const showInvalid = email.length > 0 && !valid && (touched || settled === email);

  async function send(target: string, resend = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.forgot(target);
      timer.start(target, res.cooldownSeconds ?? 60, res.expiresMinutes ?? null);
      setSentTo(target);
      if (resend) toast.show(t("recover.resent"), { tone: "success" });
    } catch (err) {
      setError(recoverError(err, t));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const target = email.trim().toLowerCase();
    if (timer.email === target) { setSentTo(target); return; }
    void send(target);
  }

  function changeEmail() {
    timer.clear();
    setSentTo(null);
    setError(null);
  }

  const backToLogin = <Link to="/entrar" className="font-semibold text-primary-text hover:text-ink">{t("recover.backToLogin")}</Link>;
  const errorBox = error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</p>;

  if (sentTo) {
    const progress = timer.total ? Math.round((timer.seconds / timer.total) * 100) : 0;
    return (
      <AuthShell title={t("recover.sentTitle")} footer={backToLogin}>
        <div className="rise rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/30">
          <span className="pop mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <MailIcon width={24} height={24} />
          </span>
          <p className="text-sm leading-relaxed text-ink-muted">
            {t("recover.sentPre")} <strong className="break-all text-ink">{sentTo}</strong>{t("recover.sentPost")}
          </p>
          {timer.minutes && <p className="mt-2 text-xs text-ink-faint">{t("recover.validFor").replace("{n}", String(timer.minutes))}</p>}
          <p className="mt-2 text-xs text-ink-faint">{t("recover.spam")}</p>
        </div>

        <div className="mt-4 space-y-3">
          {errorBox}
          <Button variant="secondary" size="lg" className="w-full" disabled={timer.seconds > 0} loading={loading} onClick={() => send(sentTo, true)}>
            {timer.seconds > 0 ? t("recover.resendIn").replace("{time}", formatClock(timer.seconds)) : t("recover.resend")}
          </Button>
          <div className="h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>
          <Button variant="ghost" size="lg" className="w-full" onClick={changeEmail}>{t("recover.otherEmail")}</Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("recover.title")} subtitle={t("recover.sub")} footer={backToLogin}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={showInvalid ? t("recover.emailInvalid") : null}
          trailing={valid ? <CheckIcon width={20} height={20} className="pop mr-2.5 text-success" /> : undefined}
        />
        {errorBox}
        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!valid}>{t("recover.send")}</Button>
      </form>
    </AuthShell>
  );
}
