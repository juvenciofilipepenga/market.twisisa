import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n/LocaleContext";
import { useAuth } from "@/auth/AuthContext";
import { PROMOS, type Promo } from "@/config/promos";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { SpeedLines } from "../brand/SpeedLines";

const SESSION_KEY = "twisisa.promo.session";
const seenKey = (id: string) => `twisisa.promo.${id}`;

function recentlySeen(p: Promo): boolean {
  try {
    const at = Number(window.localStorage.getItem(seenKey(p.id)) ?? 0);
    return at > 0 && Date.now() - at < p.cooldownHours * 3_600_000;
  } catch { return false; }
}

function markSeen(p: Promo) {
  try {
    window.localStorage.setItem(seenKey(p.id), String(Date.now()));
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch { /* sem armazenamento: pode repetir, mas nunca parte a página */ }
}

// Decide se e quando mostrar UMA promoção. Nunca interrompe: só nas rotas do config, no máximo uma por
// sessão, respeitando o intervalo de cada campanha, e nunca por cima de outro diálogo aberto.
export function PromoHost() {
  const { locale, t } = useLocale();
  const { token } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<Promo | null>(null);

  useEffect(() => {
    setPromo(null);
    try { if (window.sessionStorage.getItem(SESSION_KEY)) return; } catch { /* segue */ }

    const chosen = PROMOS.find((p) =>
      p.enabled && p.routes.includes(pathname) && !recentlySeen(p) &&
      (p.audience === "all" || (p.audience === "guest" && !token) || (p.audience === "user" && Boolean(token)))
    );
    if (!chosen) return;

    let opened = false;
    const open = () => {
      if (opened || document.querySelector('[role="dialog"]')) return;
      opened = true;
      markSeen(chosen);
      setPromo(chosen);
    };
    const timer = window.setTimeout(open, chosen.delayMs);
    const onScroll = () => {
      if (!chosen.scrollPct) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && (window.scrollY / max) * 100 >= chosen.scrollPct) open();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, [pathname, token]);

  if (!promo) return null;

  return (
    <Modal
      size="sm"
      title={promo.title[locale]}
      onClose={() => setPromo(null)}
      art={
        <div className="relative flex h-40 items-end justify-center overflow-hidden bg-primary-active sm:h-44">
          <SpeedLines className="pointer-events-none absolute -left-6 top-6 h-24 w-40 text-white/15" />
          <img src={promo.art} alt="" width={400} height={400} className="relative h-36 w-auto max-w-[70%] object-contain object-bottom sm:h-40" />
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ink-muted">{promo.body[locale]}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button size="lg" onClick={() => { const to = promo.cta.to; setPromo(null); navigate(to); }}>{promo.cta.label[locale]}</Button>
        <Button variant="ghost" onClick={() => setPromo(null)}>{t("promo.dismiss")}</Button>
      </div>
    </Modal>
  );
}
