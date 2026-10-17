import { useLocale } from "@/i18n/LocaleContext";
import { PASSWORD_MIN, passwordScore } from "@/lib/passwordRules";

const TONES = ["", "bg-danger", "bg-warning", "bg-success"];

export function PasswordMeter({ password }: { password: string }) {
  const { t } = useLocale();
  if (!password) return null;
  const score = passwordScore(password);
  const missing = PASSWORD_MIN - password.length;
  const labels = ["", t("reset.strength.weak"), t("reset.strength.ok"), t("reset.strength.strong")];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span key={step} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${score >= step ? TONES[score] : "bg-border"}`} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {missing > 0 ? t("reset.needMore").replace("{n}", String(missing)) : labels[score]}
      </p>
    </div>
  );
}
