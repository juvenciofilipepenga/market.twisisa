import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { PROMOS } from "@/config/promos";
import { useLocale } from "@/i18n/LocaleContext";
import { markSeen, recentlySeen } from "@/lib/promoSeen";
import { useNotifications } from "@/notifications/NotificationsContext";
import type { NotificationType } from "@/lib/types";
import { BoxIcon, TagIcon } from "../icons";

// Ícones TEMPORÁRIOS no header: não ficam fixos. Quando há novidade, aparecem uns segundos, desaparecem e voltam de vez em quando
// (até a pessoa tocar neles). Um de cada vez: a atualização de uma encomenda tem prioridade sobre uma promoção.
//  - Encomenda: um anel que se expande e desvanece.   - Promoção: o próprio ícone "respira".
const SHOW_MS = 6_000;
const EVERY_MS = 75_000;
// Por sessão, cada novidade aparece no máximo 4 vezes (a primeira logo + 3 lembretes): nunca vira ruído permanente.
const MAX_SHOWS = 4;
const ORDER_TYPES: NotificationType[] = ["ORDER", "PAYMENT", "DELIVERY"];

const button = "press relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary hover:bg-elevated";

function useIntermittent(key: string | null): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!key) { setVisible(false); return; }
    let hide = 0;
    let shown = 0;
    let again = 0;
    const show = () => {
      if (shown >= MAX_SHOWS) { window.clearInterval(again); return; }
      shown += 1;
      setVisible(true);
      window.clearTimeout(hide);
      hide = window.setTimeout(() => setVisible(false), SHOW_MS);
    };
    show();
    again = window.setInterval(show, EVERY_MS);
    return () => { window.clearInterval(again); window.clearTimeout(hide); setVisible(false); };
  }, [key]);
  return visible;
}

export function HeaderNudges() {
  const { t, locale } = useLocale();
  const { token } = useAuth();
  const { items } = useNotifications();
  // O que já foi tocado nesta sessão não volta (a encomenda continua não lida na lista de notificações).
  const [gone, setGone] = useState<ReadonlySet<string>>(new Set());

  const order = useMemo(
    () => (token ? (items ?? []).find((n) => !n.readAt && ORDER_TYPES.includes(n.type) && !gone.has(n.id)) ?? null : null),
    [items, token, gone]
  );
  const promo = useMemo(
    () => PROMOS.find((p) => p.enabled && p.nudge && !gone.has(p.id) && !recentlySeen(p) && (p.audience === "all" || (p.audience === "guest" && !token) || (p.audience === "user" && Boolean(token)))) ?? null,
    [token, gone]
  );

  const activeKey = order ? `order:${order.id}` : promo ? `promo:${promo.id}` : null;
  const visible = useIntermittent(activeKey);
  const forget = (id: string) => setGone((prev) => new Set(prev).add(id));

  let node: React.ReactNode = null;
  if (visible && order) {
    const orderId = typeof order.data?.orderId === "string" ? order.data.orderId : null;
    node = (
      <Link key={activeKey} to={orderId ? `/encomenda/${orderId}` : "/pedidos"} onClick={() => forget(order.id)} className={`${button} nudge-in`} aria-label={`${t("nudge.order")}: ${order.title}`}>
        <span aria-hidden="true" className="nudge-ring pointer-events-none absolute inset-1.5 rounded-xl border border-primary" />
        <BoxIcon />
      </Link>
    );
  } else if (visible && promo) {
    node = (
      <Link key={activeKey} to={promo.cta.to} onClick={() => { markSeen(promo); forget(promo.id); }} className={`${button} nudge-in`} aria-label={`${t("nudge.promo")}: ${promo.title[locale]}`}>
        <TagIcon className="nudge-breathe" />
      </Link>
    );
  }

  // A largura anima de 0 a 40px: os ícones ao lado deslizam em vez de saltarem.
  return (
    <div className={`flex items-center overflow-hidden transition-[width] duration-200 motion-reduce:transition-none ${node ? "w-10" : "w-0"}`}>
      {node}
    </div>
  );
}
