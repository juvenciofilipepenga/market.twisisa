// QUANDO O BOTÃO FLUTUANTE DO CHAT APARECE. Regra única, centralizada (o ChatWidget só a aplica).
// O botão nunca pode tapar compra, formulário ou navegação; onde não há garantia de espaço seguro, esconde-se.
// Esconder o BOTÃO não impede o chat: o rodapé e "Mais → Suporte" abrem-no por evento (lib/chatBus.ts).
//
//  /                       (sem filtros)  MOSTRA, com halo discreto — só enquanto o catálogo ainda não chegou ao ecrã:
//                                          o botão ficaria por cima do "+" dos cartões da coluna direita.
//  /?search= /?categoryId= /?page=        ESCONDE (a navegar no catálogo: os produtos têm prioridade)
//  /pesquisa                              ESCONDE (pesquisa: idem)
//  /produto/:id                           ESCONDE (barra de compra fixa e escolha de variantes)
//  /carrinho /pagamento/* /encomenda/*    ESCONDE (carrinho, pagar, enviar comprovativo, cancelar, descarregar factura)
//  /pedidos                               ESCONDE (consulta de encomendas)
//  /perfil /entrar /registar              ESCONDE (conta e formulários)
//  /admin/*                               ESCONDE (tem o seu próprio chat em /admin/chat)
//  restantes (notificações, mais, definições, instalar, legais, 404): ESCONDE por omissão.
export interface ChatFabRule {
  visible: boolean;
  /** Halo subtil para chamar a atenção (só na página inicial). */
  attention: boolean;
  /** Id do elemento que, ao chegar ao ecrã, faz o botão esconder-se (ver ChatWidget). */
  hideWhenReaching?: string;
}

const HIDDEN: ChatFabRule = { visible: false, attention: false };

export function chatFabRule(pathname: string, search: string): ChatFabRule {
  if (pathname !== "/") return HIDDEN;
  const params = new URLSearchParams(search);
  if (params.get("search") || params.get("categoryId") || params.get("page")) return HIDDEN;
  return { visible: true, attention: true, hideWhenReaching: "catalogo" };
}

/** Rotas onde o painel de conversa também não aparece (admin tem /admin/chat; pagamento é um ecrã de foco). */
export function chatPanelBlocked(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/pagamento");
}
