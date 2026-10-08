import type { ReactNode } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import { ChevronLeftIcon, ShieldIcon } from "../icons";

// Moldura do pagamento: sem rodapé nem menu da loja (nada que distraia), com o selo "Pagamento seguro" sempre à vista.
export function PaymentShell({ onBack, children, footer }: { onBack: () => void; children: ReactNode; footer?: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-3">
          <button type="button" onClick={onBack} aria-label={t("pay.back")} className="press flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-elevated hover:text-ink">
            <ChevronLeftIcon width={20} height={20} />
          </button>
          <p className="flex items-center gap-1.5 text-sm font-semibold"><ShieldIcon width={16} height={16} className="text-success" />{t("pay.secure")}</p>
          <span className="w-10" aria-hidden="true" />
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-36 pt-5">
        {children}
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-faint">
          {t("pay.processedBy")}
          <span className="rounded-md bg-white px-2 py-1"><img src={img.payZumbopay} alt="ZumboPay" width={96} height={48} className="h-4 w-auto" /></span>
        </p>
      </main>
      {footer}
    </div>
  );
}

// Logótipo do método sobre um azulejo claro: legível sobre o tema escuro e reconhecível de relance.
export function MethodLogo({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
    </span>
  );
}
