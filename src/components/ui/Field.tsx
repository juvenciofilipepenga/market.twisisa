import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { EyeIcon, EyeOffIcon } from "../icons";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  hint?: string;
  error?: string | null;
  trailing?: ReactNode;
  className?: string;
}

const inputClass = "h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-60 sm:text-sm";

// Campo com etiqueta visível (não só placeholder), 16 px em telemóvel (evita o zoom automático do iOS) e erro ligado por aria.
export function Field({ label, hint, error, trailing, id, className = "", ...rest }: FieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = error ? `${fid}-err` : hint ? `${fid}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</label>
      <div className="relative">
        <input id={fid} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={`${inputClass} ${trailing ? "pr-12" : ""} ${error ? "border-danger" : "border-border focus:border-ink-faint"}`} {...rest} />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? <p id={`${fid}-err`} role="alert" className="mt-1.5 text-xs text-danger">{error}</p> : hint ? <p id={`${fid}-hint`} className="mt-1.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, "type" | "trailing">) {
  const { t } = useLocale();
  const [shown, setShown] = useState(false);
  return (
    <Field
      {...props}
      type={shown ? "text" : "password"}
      trailing={
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? t("auth.hidePassword") : t("auth.showPassword")} aria-pressed={shown} className="press flex h-10 w-10 items-center justify-center rounded-lg text-ink-faint hover:text-ink">
          {shown ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
        </button>
      }
    />
  );
}
