import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { img } from "@/lib/images";
import { SpeedLines } from "../brand/SpeedLines";
import { LanguageToggle } from "../layout/LanguageToggle";

interface Props { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }

// Entrar e registar: ecrã de foco. Em ecrã largo, painel de marca com o fundo de fitas e a mascote;
// em telemóvel, só a mascote pequena e o formulário.
export function AuthShell({ title, subtitle, children, footer }: Props) {
  const { t } = useLocale();
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-bg bg-cover bg-center lg:flex" style={{ backgroundImage: `url(${img.heroBackdrop})` }}>
        <Link to="/" className="relative flex items-center gap-2 p-10">
          <img src="/logo.png" alt="" width={40} height={40} />
          <span className="font-display text-xl font-extrabold">Twisisa Market</span>
        </Link>
        <div className="relative px-10">
          <SpeedLines className="mb-6 h-14 w-24 text-primary" />
          <p className="max-w-sm font-display text-4xl font-extrabold leading-[1.1]">{t("auth.sideTitle")}</p>
        </div>
        <img src={img.mascotPayment} alt="" width={900} height={952} className="relative ml-auto mr-6 h-[26rem] w-auto object-contain object-bottom" />
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 lg:justify-end">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img src="/logo.png" alt="" width={32} height={32} />
            <span className="font-display text-lg font-extrabold">Twisisa</span>
          </Link>
          <LanguageToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-2">
          <div className="w-full max-w-sm">
            <img src={img.mascotPayment} alt="" width={900} height={952} className="mb-3 h-24 w-auto object-contain lg:hidden" />
            <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
