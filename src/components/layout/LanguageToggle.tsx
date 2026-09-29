import { useLocale } from "@/i18n/LocaleContext";
import { GlobeIcon } from "../icons";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-muted hover:bg-elevated hover:text-ink"
      aria-label="Mudar idioma / Change language"
    >
      <GlobeIcon width={18} height={18} />
      {locale.toUpperCase()}
    </button>
  );
}
