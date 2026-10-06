import type { ComponentType, SVGProps } from "react";
import { ChatIcon, ClipboardIcon, CookieIcon, DocumentIcon, DownloadIcon, SettingsIcon, ShieldIcon } from "@/components/icons";

// REGISTO DA PÁGINA "MAIS". Para pôr uma funcionalidade nova em "Mais" basta acrescentar uma linha a MORE_ITEMS:
// a barra de navegação inferior nunca muda (tem sempre 5 destinos). Só entram aqui páginas que EXISTEM — nada de
// ligações mortas. Grupos vazios (para o tipo de utilizador actual) não aparecem.
//   audience: "client" = só com sessão iniciada · "any" = visitantes e clientes
//   to        = rota interna · action = comportamento especial (abrir o chat, terminar sessão)
export type MoreGroupId = "account" | "help" | "app" | "legal";
export type MoreIconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface MoreItem {
  id: string;
  group: MoreGroupId;
  labelKey: string;
  descKey?: string;
  Icon: MoreIconType;
  audience: "any" | "client";
  to?: string;
  action?: "openChat";
}

// Ordem dos grupos: o que se usa mais primeiro; legal e informação no fim.
export const MORE_GROUPS: Array<{ id: MoreGroupId; titleKey: string }> = [
  { id: "account", titleKey: "more.group.account" },
  { id: "help", titleKey: "more.group.help" },
  { id: "app", titleKey: "more.group.app" },
  { id: "legal", titleKey: "more.group.legal" }
];

// A ordem dentro de cada grupo é a ordem desta lista.
export const MORE_ITEMS: MoreItem[] = [
  { id: "orders", group: "account", labelKey: "more.item.orders", descKey: "more.item.ordersDesc", Icon: ClipboardIcon, audience: "client", to: "/pedidos" },
  { id: "invoices", group: "account", labelKey: "more.item.invoices", descKey: "more.item.invoicesDesc", Icon: DocumentIcon, audience: "client", to: "/pedidos?faturas=1" },
  { id: "settings", group: "account", labelKey: "more.item.settings", descKey: "more.item.settingsDesc", Icon: SettingsIcon, audience: "any", to: "/definicoes" },
  { id: "support", group: "help", labelKey: "more.item.support", descKey: "more.item.supportDesc", Icon: ChatIcon, audience: "any", action: "openChat" },
  { id: "install", group: "app", labelKey: "more.item.install", descKey: "more.item.installDesc", Icon: DownloadIcon, audience: "any", to: "/instalar" },
  { id: "terms", group: "legal", labelKey: "legal.terms", Icon: DocumentIcon, audience: "any", to: "/termos" },
  { id: "privacy", group: "legal", labelKey: "legal.privacy", Icon: ShieldIcon, audience: "any", to: "/privacidade" },
  { id: "cookies", group: "legal", labelKey: "legal.cookies", Icon: CookieIcon, audience: "any", to: "/cookies" }
];
