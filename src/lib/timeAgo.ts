// "há 5 min", "há 2 h", "ontem" ou "10 out": o que se lê de relance numa lista de notificações.
export function timeAgo(iso: string, locale: string, t: (k: string) => string): string {
  const then = new Date(iso);
  const mins = Math.round((Date.now() - then.getTime()) / 60_000);
  if (mins < 1) return t("notif.now");
  if (mins < 60) return `${t("notif.ago")} ${mins} min`.trim() + (locale === "en" ? ` ${t("notif.agoAfter")}` : "");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${t("notif.ago")} ${hours} h`.trim() + (locale === "en" ? ` ${t("notif.agoAfter")}` : "");
  return then.toLocaleDateString(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short" });
}
