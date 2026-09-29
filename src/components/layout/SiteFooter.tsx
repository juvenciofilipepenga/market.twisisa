import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { COMPANY } from "@/config/company";
import type { Category } from "@/lib/types";
import { SpeedLines } from "../brand/SpeedLines";
import { LanguageToggle } from "./LanguageToggle";

const link = "text-sm text-ink-muted transition-colors hover:text-ink";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-widest text-ink-faint">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.categories.list().then((c) => setCategories(c.slice(0, 5))).catch(() => setCategories([]));
  }, []);

  const socials = Object.entries(COMPANY.social);

  return (
    <footer className="relative mt-32 border-t border-border bg-surface sm:mt-44">
      {/* A mascote espreita por cima do rodapé (a imagem tem o corte inferior recto) */}
      <img src={img.mascotPeek} alt="" width={1007} height={871} loading="lazy" className="pointer-events-none absolute right-4 top-0 w-36 -translate-y-[98%] sm:right-12 sm:w-52 md:w-64" />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-12 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="" width={36} height={36} loading="lazy" />
            <span className="font-display text-xl font-extrabold">{COMPANY.name}</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">{t("footer.tagline")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["M-Pesa", "e-Mola", t("hero.card")].map((m) => (
              <span key={m} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink-muted">{m}</span>
            ))}
          </div>
        </div>

        <Column title={t("footer.shop")}>
          <li><Link to="/" className={link}>{t("nav.home")}</Link></li>
          {categories.map((c) => (
            <li key={c.id}><Link to={`/?categoryId=${c.id}`} className={link}>{c.name}</Link></li>
          ))}
        </Column>

        <Column title={t("footer.account")}>
          {token ? (
            <li><Link to="/perfil" className={link}>{t("nav.profile")}</Link></li>
          ) : (
            <>
              <li><Link to="/entrar" className={link}>{t("auth.login")}</Link></li>
              <li><Link to="/registar" className={link}>{t("auth.register")}</Link></li>
            </>
          )}
          <li><Link to="/carrinho" className={link}>{t("nav.cart")}</Link></li>
          <li><Link to="/notificacoes" className={link}>{t("nav.notifications")}</Link></li>
        </Column>

        <Column title={t("footer.legal")}>
          <li><Link to="/termos" className={link}>{t("legal.terms")}</Link></li>
          <li><Link to="/privacidade" className={link}>{t("legal.privacy")}</Link></li>
          <li><Link to="/cookies" className={link}>{t("legal.cookies")}</Link></li>
        </Column>

        <Column title={t("footer.help")}>
          <li className="max-w-[14rem] text-sm leading-relaxed text-ink-muted">{t("footer.helpText")}</li>
          {COMPANY.email && <li><a href={`mailto:${COMPANY.email}`} className={link}>{COMPANY.email}</a></li>}
          {COMPANY.phone && <li><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className={link}>{COMPANY.phone}</a></li>}
          {socials.map(([name, url]) => (
            <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className={link}>{name}</a></li>
          ))}
        </Column>
      </div>

      {/* Faixa de capulana: imagem única (não repete, o padrão tem costura visível) */}
      <div className="mx-auto max-w-6xl px-4">
        <div aria-hidden="true" className="h-16 rounded-2xl bg-cover bg-center sm:h-20" style={{ backgroundImage: `url(${img.patternCapulana})` }} />
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-6 text-xs text-ink-faint">
        <p>© {new Date().getFullYear()} {COMPANY.legalName || COMPANY.name}. {t("footer.rights")}</p>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-lg px-2 py-1.5 font-semibold text-ink-muted hover:bg-elevated hover:text-ink">
            {t("footer.top")} ↑
          </button>
        </div>
      </div>

      {/* Palavra gigante, cortada na base, com as linhas de velocidade por trás */}
      <div aria-hidden="true" className="relative select-none overflow-hidden pt-4">
        <SpeedLines className="absolute -left-10 top-6 h-40 w-72 text-white/[0.04] md:h-64 md:w-[28rem]" />
        <p className="relative whitespace-nowrap bg-gradient-to-b from-primary via-primary-active to-bg bg-clip-text text-center font-display text-[min(25vw,24rem)] font-extrabold leading-[0.78] tracking-tighter text-transparent" style={{ height: "0.55em" }}>
          Twisisa
        </p>
      </div>
    </footer>
  );
}
