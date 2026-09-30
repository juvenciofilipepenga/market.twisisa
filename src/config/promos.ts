import type { Locale } from "@/i18n/dictionaries";
import { img } from "@/lib/images";

type Localized = Record<Locale, string>;

export interface Promo {
  id: string;
  enabled: boolean;
  /** guest = sem sessão, user = com sessão. */
  audience: "guest" | "user" | "all";
  /** Só aparece nestas rotas (a promoção nunca interrompe o carrinho, o pagamento ou o login). */
  routes: string[];
  /** Abre passado este tempo... */
  delayMs: number;
  /** ...ou quando o visitante já viu esta % da página (o que acontecer primeiro). */
  scrollPct?: number;
  /** Depois de vista (fechada ou clicada), só volta a aparecer passadas estas horas. */
  cooldownHours: number;
  art: string;
  title: Localized;
  body: Localized;
  cta: { label: Localized; to: string };
}

// Regras globais (ver PromoHost): no máximo UMA promoção por sessão e nunca por cima de outro diálogo.
// Só as promoções `enabled` aparecem. As duas primeiras descrevem funcionalidades que a loja já tem
// (conta com notificações, programa de convites) e por isso não prometem nada que não exista.
export const PROMOS: Promo[] = [
  {
    id: "welcome-guest",
    enabled: true,
    audience: "guest",
    routes: ["/"],
    delayMs: 9000,
    scrollPct: 45,
    cooldownHours: 72,
    art: img.mascotDelivery,
    title: { pt: "Bem-vindo ao Twisisa Market", en: "Welcome to Twisisa Market" },
    body: {
      pt: "Crie a sua conta para acompanhar as suas encomendas e receber notificações a cada passo.",
      en: "Create your account to follow your orders and get notified at every step."
    },
    cta: { label: { pt: "Criar conta", en: "Create account" }, to: "/registar" }
  },
  {
    id: "invite-friends",
    enabled: true,
    audience: "user",
    routes: ["/"],
    delayMs: 14000,
    cooldownHours: 24 * 7,
    art: img.mascotCelebrate,
    title: { pt: "Convide os seus amigos", en: "Invite your friends" },
    body: {
      pt: "Partilhe o seu link de convite e acompanhe quantos amigos já compraram.",
      en: "Share your invite link and see how many friends have already bought."
    },
    cta: { label: { pt: "Ver o meu link", en: "See my link" }, to: "/perfil" }
  },
  {
    // MODELO para campanhas reais. Fica desligada: o backend ainda não tem descontos, e uma promoção
    // com preço/percentagem inventados seria enganar o cliente. Quando existir, preencher e pôr enabled: true.
    id: "campaign-template",
    enabled: false,
    audience: "all",
    routes: ["/"],
    delayMs: 6000,
    cooldownHours: 24,
    art: img.tag,
    title: { pt: "Título da campanha", en: "Campaign title" },
    body: { pt: "Descreva a oferta real e as suas condições.", en: "Describe the real offer and its conditions." },
    cta: { label: { pt: "Ver oferta", en: "See offer" }, to: "/" }
  }
];
