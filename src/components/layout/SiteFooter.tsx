import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { openChat } from "@/lib/chatBus";
import { useInView } from "@/lib/useInView";
import { COMPANY } from "@/config/company";
import type { Category } from "@/lib/types";
import { SpeedLines } from "../brand/SpeedLines";
import { Button } from "../ui/Button";
import { ChatIcon, ChevronRightIcon } from "../icons";
import { LanguageToggle } from "./LanguageToggle";

const link = "inline-flex min-h-[32px] items-center text-sm text-ink-muted transition-colors hover:text-ink";

// Telemóvel: cada coluna é uma secção que abre e fecha (o rodapé fica com ~5 linhas em vez de um ecrã inteiro de links
// e quem chega ao fim vê logo "Ajuda"). Ecrã largo (md+): colunas normais, sempre abertas.
function Column({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <nav aria-label={title} className="border-b border-border md:border-0">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="flex min-h-[48px] w-full items-center justify-between font-sans text-xs font-bold uppercase tracking-widest text-ink-faint md:hidden">
        {title}
        <ChevronRightIcon width={16} height={16} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <h2 className="mb-2 hidden font-sans text-xs font-bold uppercase tracking-widest text-ink-faint md:block">{title}</h2>
      <ul id={id} className={`space-y-0.5 pb-3 md:block md:pb-0 ${open ? "block" : "hidden"}`}>{children}</ul>
    </nav>
  );
}

export function SiteFooter() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  // A capulana (~170 KB) só é pedida quando o rodapé está quase a aparecer: poupa dados a quem não chega cá.
  const [footerRef, nearView] = useInView<HTMLElement>({ rootMargin: "500px 0px", threshold: 0 });

  useEffect(() => {
    api.categories.list().then((c) => setCategories(c.slice(0, 5))).catch(() => setCategories([]));
  }, []);

  const socials = Object.entries(COMPANY.social);

  return (
    <footer ref={footerRef} className="relative mt-28 border-t border-border bg-surface sm:mt-44">
      {/* A mascote espreita por cima do rodapé (a imagem tem o corte inferior recto) */}
      <img src={img.mascotPeek} alt="" width={1007} height={871} loading="lazy" className="pointer-events-none absolute right-4 top-0 w-28 -translate-y-[98%] sm:right-12 sm:w-52 md:w-64" />

      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-0 px-4 pb-6 pt-10 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] md:gap-y-8 md:pb-10 md:pt-12">
        <div className="pb-6 md:col-span-1 md:pb-0">
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
          {categories.map((c) => <li key={c.id}><Link to={`/?categoryId=${c.id}`} className={link}>{c.name}</Link></li>)}
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
          {token && <li><Link to="/notificacoes" className={link}>{t("nav.notifications")}</Link></li>}
          <li><Link to="/instalar" className={link}>{t("install.nav")}</Link></li>
        </Column>

        <Column title={t("footer.legal")}>
          <li><Link to="/termos" className={link}>{t("legal.terms")}</Link></li>
          <li><Link to="/privacidade" className={link}>{t("legal.privacy")}</Link></li>
          <li><Link to="/cookies" className={link}>{t("legal.cookies")}</Link></li>
        </Column>

        <Column title={t("footer.help")} defaultOpen>
          <li className="max-w-[15rem] pb-2 text-sm leading-relaxed text-ink-muted">{t("footer.helpText")}</li>
          <li><Button size="sm" variant="secondary" onClick={openChat}><ChatIcon width={16} height={16} />{t("footer.openChat")}</Button></li>
          {COMPANY.email && <li className="pt-2"><a href={`mailto:${COMPANY.email}`} className={link}>{COMPANY.email}</a></li>}
          {COMPANY.phone && <li><a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className={link}>{COMPANY.phone}</a></li>}
          {socials.map(([name, url]) => <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className={link}>{name}</a></li>)}
        </Column>
      </div>

      {/* Faixa de capulana: imagem única (não repete: o padrão tem costura visível) */}
      <div className="mx-auto max-w-6xl px-4">
        <div aria-hidden="true" className="h-10 rounded-2xl bg-cover bg-center sm:h-20" style={{ backgroundImage: nearView ? `url(${img.patternCapulana})` : undefined, backgroundColor: "#C40005" }} />
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-6 text-xs text-ink-faint">
        <p>© {new Date().getFullYear()} {COMPANY.legalName || COMPANY.name}. {t("footer.rights")}</p>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            className="press h-9 rounded-lg px-2 font-semibold text-ink-muted hover:bg-elevated hover:text-ink"
          >
            {t("footer.top")} ↑
          </button>
        </div>
      </div>

      {/* Palavra gigante, cortada na base, com as linhas de velocidade por trás */}
      <div aria-hidden="true" className="relative hidden select-none overflow-hidden pt-4 md:block">
        <SpeedLines className="absolute -left-10 top-6 h-40 w-72 text-white/[0.04] md:h-64 md:w-[28rem]" />
        <p className="relative whitespace-nowrap bg-gradient-to-b from-primary via-primary-active to-bg bg-clip-text text-center font-display text-[min(25vw,24rem)] font-extrabold leading-[0.78] tracking-tighter text-transparent" style={{ height: "0.55em" }}>
          Twisisa
        </p>
      </div>
    </footer>
  );
}
