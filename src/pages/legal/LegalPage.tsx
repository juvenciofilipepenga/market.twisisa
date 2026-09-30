import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { Header } from "@/components/layout/Header";
import { LEGAL, type LegalKey } from "@/content/legal";
import { COMPANY } from "@/config/company";
import { img } from "@/lib/images";
import { useDocumentMeta } from "@/lib/useDocumentMeta";

export default function LegalPage({ doc }: { doc: LegalKey }) {
  const { t, locale } = useLocale();
  const content = LEGAL[locale][doc];
  const [active, setActive] = useState(0);
  useDocumentMeta({ title: `${content.title} · Twisisa Market`, description: content.sections[0]?.body[0] });
  const art = doc === "privacy" ? img.shield : doc === "terms" ? img.tag : null;

  // Índice lateral acompanha a secção visível
  useEffect(() => {
    const els = content.sections.map((_, i) => document.getElementById(`s-${i}`)).filter((e): e is HTMLElement => e !== null);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.id.replace("s-", ""))); });
    }, { rootMargin: "-20% 0px -70% 0px" });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

  const updated = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { dateStyle: "long" }).format(new Date(content.updated));
  const identity = [COMPANY.legalName, COMPANY.nuit && `NUIT ${COMPANY.nuit}`, COMPANY.address, COMPANY.email].filter(Boolean).join(" · ");

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">{content.title}</h1>
            <p className="mt-2 text-sm text-ink-faint">{t("legal.updated")}: {updated}</p>
            {identity && <p className="mt-1 text-sm text-ink-muted">{identity}</p>}
          </div>
          {art && <img src={art} alt="" width={700} height={800} className="h-20 w-auto shrink-0 md:h-28" />}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr]">
          <nav aria-label={t("legal.toc")} className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-faint">{t("legal.toc")}</p>
              <ul className="space-y-1 border-l border-border">
                {content.sections.map((s, i) => (
                  <li key={s.heading}>
                    <button
                      onClick={() => document.getElementById(`s-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className={`-ml-px block w-full border-l-2 py-1.5 pl-4 text-left text-sm transition-colors ${active === i ? "border-primary font-semibold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
                    >{s.heading}</button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <article className="max-w-2xl space-y-10">
            {content.sections.map((s, i) => (
              <section key={s.heading} id={`s-${i}`} className="scroll-mt-32">
                <h2 className="mb-3 text-xl font-bold">{i + 1}. {s.heading}</h2>
                <div className="space-y-3 leading-relaxed text-ink-muted">
                  {s.body.map((p) => <p key={p}>{p}</p>)}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </main>
  );
}
