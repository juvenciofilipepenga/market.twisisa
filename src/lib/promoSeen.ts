import type { Promo } from "@/config/promos";

// Memória das promoções já vistas (por campanha, com o intervalo definido no config). Partilhada pelo diálogo (PromoHost)
// e pelo ícone temporário do header, para não mostrar a mesma campanha duas vezes.
export const PROMO_SESSION_KEY = "twisisa.promo.session";
const seenKey = (id: string) => `twisisa.promo.${id}`;

export function recentlySeen(p: Promo): boolean {
  try {
    const at = Number(window.localStorage.getItem(seenKey(p.id)) ?? 0);
    return at > 0 && Date.now() - at < p.cooldownHours * 3_600_000;
  } catch { return false; }
}

/** Marca como vista. `session: true` (diálogos) também impede outro diálogo nesta sessão; o ícone do header não precisa. */
export function markSeen(p: Promo, session = false) {
  try {
    window.localStorage.setItem(seenKey(p.id), String(Date.now()));
    if (session) window.sessionStorage.setItem(PROMO_SESSION_KEY, "1");
  } catch { /* sem armazenamento: pode repetir, mas nunca parte a página */ }
}
