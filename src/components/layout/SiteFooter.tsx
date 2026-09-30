import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/lib/api";
import { img } from "@/lib/images";
import { openChat } from "@/lib/chatBus";
import { useInView } from "@/lib/useInView";
import { COMPANY } from "@/config/company";
import type { Category } from "@/lib/types";
import { Reveal } from "../ui/Reveal";
import { SpeedLines } from "../brand/SpeedLines";
import { LanguageToggle } from "./LanguageToggle";
import {
  HomeIcon, GridIcon, TagIcon, UserIcon, LogInIcon, UserPlusIcon, CartIcon, BellIcon,
  DocumentIcon, ShieldIcon, CookieIcon, ChatIcon, MailIcon, PhoneIcon, GlobeIcon, PinIcon,
  SparkIcon, ArrowRightIcon, ArrowUpIcon, ArrowUpRightIcon
} from "../icons";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface FooterLinkProps { icon: IconType; to?: string; href?: string; external?: boolean; children: ReactNode }

// Link do rodapé: ícone num "selo" que acende, texto que avança e seta que surge (ver .f-link em index.css).
// Altura mínima de 44px: alvo de toque confortável no telemóvel.
function FooterLink({ icon: Icon, to, href, external, children }: FooterLinkProps) {
  const cls = "f-link group flex min-h-[44px] items-center gap-3 rounded-xl text-sm font-medium text-ink-muted transition-colors hover:text-ink";
  const inner = (
    <>
      <span className="f-ico flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-elevated text-ink-faint"><Icon width={18} height={18} /></span>
      <span className="f-label min-w-0 truncate">{children}</span>
      <ArrowUpRightIcon className="f-arrow ml-auto shrink-0 text-primary-text" width={15} height={15} />
    </>
  );
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{inner}</a>;
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-2 font-sans text-xs font-bold uppercase tracking-widest text-ink-faint">{title}</h2>
      <ul>{children}</ul>
    </nav>
  );
}

function scrollTop() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

export function SiteFooter() {
  const { t } = useLocale();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  // A capulana (≈180 KB) só é pedida quando o rodapé está quase a aparecer: poupa dados a quem não chega cá.
  const [footerRef, nearView] = useInView<HTMLElement>({ rootMargin: "400px 0px", threshold: 0 });
  const fabric = nearView ? `url(${img.patternCapulana})` : "none";

  useEffect(() => {
    api.categories.list().then((c) => setCategories(c.slice(0, 5))).catch(() => setCategories([]));
  }, []);

  const socials = Object.entries(COMPANY.social);
  const marquee = [t("footer.m1"), t("footer.m2"), t("footer.m3"), t("footer.m4")];
  const hasContacts = Boolean(COMPANY.email || COMPANY.phone);

  function goToCatalog() {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const track = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {marquee.map((word) => (
        <li key={word} className="flex items-center">
          <span className="px-5 font-display text-xl font-extrabold uppercase tracking-tight text-ink sm:px-8 sm:text-3xl">{word}</span>
          <SparkIcon width={22} height={22} className="shrink-0 text-primary" fill="currentColor" strokeWidth={1} />
        </li>
      ))}
    </ul>
  );

  return (
    <footer ref={footerRef} className="relative mt-24 sm:mt-32">
      {/* 1. Convite final: a qualidade em primeiro plano, mascote a sair da base do cartão */}
      <Reveal variant="scale" className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary-active">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: fabric,
              WebkitMaskImage: "linear-gradient(to left, #000, transparent 75%)",
              maskImage: "linear-gradient(to left, #000, transparent 75%)"
            } as CSSProperties}
          />
          <SpeedLines className="pointer-events-none absolute -left-8 top-5 h-24 w-40 text-white/15 md:h-32 md:w-52" />
          <div className="relative grid items-end gap-2 md:grid-cols-[1fr_auto]">
            <div className="p-6 pb-2 md:p-12 md:pr-0">
              <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.08] text-white md:text-5xl">{t("footer.cta.title")}</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 md:text-base">{t("footer.cta.body")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/" onClick={goToCatalog} className="press nudge-arrow inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-primary-active hover:bg-ink">
                  {t("footer.cta.shop")}<ArrowRightIcon className="arrow" width={18} height={18} />
                </Link>
                <button onClick={openChat} className="press inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/40 px-5 text-sm font-bold text-white hover:bg-white/10">
                  <ChatIcon width={18} height={18} />{t("footer.cta.chat")}
                </button>
              </div>
            </div>
            <img src={img.mascotPeek} alt="" width={1007} height={871} loading="lazy" className="pointer-events-none ml-auto mr-4 w-40 sm:w-52 md:mr-10 md:w-72" />
          </div>
        </div>
      </Reveal>

      {/* 2. Faixa de tecido em movimento, com bainha em dentes de serra */}
      <div className="fabric-band marquee-wrap relative z-10 mt-16 sm:mt-20">
        <div className="overflow-hidden py-4 sm:py-5">
          <div className="marquee">{track(false)}{track(true)}</div>
        </div>
      </div>

      <div className="bg-surface">
        {/* 3. Marca, suporte e navegação */}
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-12 pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)] lg:gap-16">
          <Reveal>
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="" width={44} height={44} loading="lazy" />
              <span className="font-display text-2xl font-extrabold">{COMPANY.name}</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{t("footer.tagline")}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink-muted">
              <PinIcon width={14} height={14} className="text-primary-text" />{t("footer.market")}
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-bg/40 p-4">
              <p className="flex items-center gap-2.5 text-sm font-bold">
                <span aria-hidden="true" className="live-dot h-2.5 w-2.5 rounded-full bg-success" />{t("footer.support")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t("footer.supportBody")}</p>
              <button onClick={openChat} className="press mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover">
                <ChatIcon width={18} height={18} />{t("footer.openChat")}
              </button>
              {hasContacts && (
                <ul className="mt-3 border-t border-border pt-2">
                  {COMPANY.email && <li><FooterLink icon={MailIcon} href={`mailto:${COMPANY.email}`}>{COMPANY.email}</FooterLink></li>}
                  {COMPANY.phone && <li><FooterLink icon={PhoneIcon} href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</FooterLink></li>}
                </ul>
              )}
            </div>

            {socials.length > 0 && (
              <div className="mt-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-ink-faint">{t("footer.follow")}</p>
                <ul className="flex flex-wrap gap-x-4">
                  {socials.map(([name, url]) => (
                    <li key={name}><FooterLink icon={GlobeIcon} href={url} external>{name}</FooterLink></li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>

          <div className="grid grid-cols-2 content-start gap-x-6 gap-y-10 sm:grid-cols-3">
            <Reveal delay={80}>
              <Column title={t("footer.shop")}>
                <li><FooterLink icon={HomeIcon} to="/">{t("nav.home")}</FooterLink></li>
                {categories.map((c) => (
                  <li key={c.id}><FooterLink icon={TagIcon} to={`/?categoryId=${c.id}`}>{c.name}</FooterLink></li>
                ))}
                {categories.length === 0 && <li><FooterLink icon={GridIcon} to="/">{t("footer.allProducts")}</FooterLink></li>}
              </Column>
            </Reveal>

            <Reveal delay={160}>
              <Column title={t("footer.account")}>
                {token ? (
                  <li><FooterLink icon={UserIcon} to="/perfil">{t("nav.profile")}</FooterLink></li>
                ) : (
                  <>
                    <li><FooterLink icon={LogInIcon} to="/entrar">{t("auth.login")}</FooterLink></li>
                    <li><FooterLink icon={UserPlusIcon} to="/registar">{t("auth.register")}</FooterLink></li>
                  </>
                )}
                <li><FooterLink icon={CartIcon} to="/carrinho">{t("nav.cart")}</FooterLink></li>
                <li><FooterLink icon={BellIcon} to="/notificacoes">{t("nav.notifications")}</FooterLink></li>
              </Column>
            </Reveal>

            <Reveal delay={240} className="col-span-2 sm:col-span-1">
              <Column title={t("footer.legal")}>
                <li><FooterLink icon={DocumentIcon} to="/termos">{t("legal.terms")}</FooterLink></li>
                <li><FooterLink icon={ShieldIcon} to="/privacidade">{t("legal.privacy")}</FooterLink></li>
                <li><FooterLink icon={CookieIcon} to="/cookies">{t("legal.cookies")}</FooterLink></li>
              </Column>
            </Reveal>
          </div>
        </div>

        {/* 4. Base */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-xs text-ink-faint">
          <p>© {new Date().getFullYear()} {COMPANY.legalName || COMPANY.name}. {t("footer.rights")}</p>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button onClick={scrollTop} aria-label={t("footer.top")} className="press flex h-11 w-11 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-primary hover:bg-primary hover:text-white">
              <ArrowUpIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* 5. A marca "vestida" de capulana: o tecido corre devagar por dentro das letras e esbate na base */}
        <div aria-hidden="true" className="select-none overflow-hidden pt-4">
          <p
            className="capulana-text whitespace-nowrap text-center font-display text-[min(25vw,24rem)] font-extrabold leading-[0.78] tracking-tighter"
            style={{
              height: "0.55em",
              "--capulana": fabric,
              WebkitMaskImage: "linear-gradient(to bottom, #000 45%, transparent)",
              maskImage: "linear-gradient(to bottom, #000 45%, transparent)"
            } as CSSProperties}
          >
            Twisisa
          </p>
        </div>
      </div>
    </footer>
  );
}
