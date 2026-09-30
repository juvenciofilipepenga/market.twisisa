import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { useCopy } from "@/lib/useCopy";
import { img } from "@/lib/images";
import { COMPANY } from "@/config/company";
import type { ReferralInfo } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { GiftIcon, ClipboardIcon, CheckIcon, LinkIcon, ChatIcon, ShareIcon } from "@/components/icons";

// O número sobe até ao valor real (700 ms). Sem animação para quem pede menos movimento.
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function ReferralCard({ referral }: { referral: ReferralInfo }) {
  const { t } = useLocale();
  const { copiedKey, failed, copy } = useCopy();
  const count = useCountUp(referral.completedReferrals);

  const code = referral.referralCode;
  const link = `${window.location.origin}/registar?ref=${encodeURIComponent(code)}`;
  const shareText = t("profile.referralShareText");
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const groups = code.match(/.{1,5}/g) ?? [code];
  const codeCopied = copiedKey === "code";
  const linkCopied = copiedKey === "link";

  function share() {
    navigator.share({ title: COMPANY.name, text: shareText, url: link }).catch(() => { /* o utilizador cancelou */ });
  }

  return (
    <Reveal as="section" className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text"><GiftIcon width={22} height={22} /></span>
          <div>
            <h2 className="font-display text-lg font-bold leading-tight">{t("profile.referralTitle")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t("profile.referralBody")}</p>
          </div>
        </div>

        {/* Bilhete: recortes laterais, linha tracejada e o código em destaque */}
        <div className="ticket mt-4 bg-gradient-to-br from-primary-soft to-elevated p-2">
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 py-3 pl-5 pr-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">{t("profile.referralCode")}</p>
              <p
                key={codeCopied ? "copied" : "idle"}
                className={`mt-1 flex flex-wrap gap-x-2.5 font-mono text-lg font-bold leading-snug tracking-wider transition-colors sm:text-xl ${codeCopied ? "pop text-success" : "text-ink"}`}
              >
                <span className="sr-only">{code}</span>
                {groups.map((g, i) => <span key={i} aria-hidden="true">{g}</span>)}
              </p>
            </div>
            <button
              onClick={() => copy(code, "code")}
              aria-label={codeCopied ? t("common.copied") : `${t("common.copy")}: ${t("profile.referralCode")}`}
              className={`press flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${codeCopied ? "border-success/50 bg-success/15 text-success" : "border-border bg-bg/40 text-ink-muted hover:border-primary hover:text-ink"}`}
            >
              {codeCopied ? <CheckIcon className="pop" width={22} height={22} /> : <ClipboardIcon width={22} height={22} />}
            </button>
          </div>
        </div>
        <p role="status" aria-live="polite" className={`mt-2 min-h-[1.25rem] text-xs ${failed ? "text-danger" : "text-success"}`}>
          {codeCopied || linkCopied ? t("common.copied") : failed ? t("common.error") : ""}
        </p>

        <div className="mt-1 grid grid-cols-2 gap-2">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover">
            <ChatIcon width={18} height={18} />{t("profile.referralWhatsapp")}
          </a>
          <button onClick={() => copy(link, "link")} className="press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-elevated px-4 text-sm font-bold text-ink hover:border-ink-faint">
            {linkCopied ? <CheckIcon width={18} height={18} className="text-success" /> : <LinkIcon width={18} height={18} />}
            {t("profile.referralCopyLink")}
          </button>
        </div>
        {canShare && (
          <button onClick={share} className="press mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-ink-muted hover:text-ink">
            <ShareIcon width={18} height={18} />{t("profile.referralShare")}
          </button>
        )}
      </div>

      {/* Resultado real: só mostra o que o backend devolve, sem metas inventadas */}
      <div className="flex items-center gap-4 border-t border-border bg-bg/30 px-4 py-3 sm:px-5">
        {referral.completedReferrals > 0 && <img src={img.mascotCelebrate} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 object-contain" />}
        <div>
          <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{count}</p>
          <p className="mt-1 text-xs text-ink-muted">{referral.completedReferrals > 0 ? t("profile.referralCount") : t("profile.referralEmpty")}</p>
        </div>
        {(referral.pendingReferrals ?? 0) > 0 && (
          <p className="ml-auto max-w-[9rem] text-right text-xs leading-snug text-ink-faint">
            <span className="font-bold text-ink-muted">{referral.pendingReferrals}</span> {t("profile.referralPending")}
          </p>
        )}
      </div>
    </Reveal>
  );
}
