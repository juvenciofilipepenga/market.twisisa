// Ponto único das imagens de estilo do site (mascote, objectos 3D, fundos).
// Por omissão vêm de public/img. Para passar ao Cloudinary basta definir VITE_ASSETS_URL
// (ex.: https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/twisisa) e carregar lá
// os mesmos nomes de ficheiro — nenhum componente precisa de mudar.
const BASE = (import.meta.env.VITE_ASSETS_URL ?? "/img").replace(/\/$/, "");
const u = (name: string) => `${BASE}/${name}.webp`;

// CONTRATO DE USO — cada imagem tem uma função; usá-la fora dela passa a mensagem errada.
// Antes de pôr uma imagem num sítio novo, confirme que a função abaixo é a do sítio.
export const img = {
  // Mascote com uma caixa nas mãos → encomenda A CAMINHO e mensagem de boas-vindas da loja (hero sem destaques).
  mascotDelivery: u("mascote-entrega"),
  // Mascote a espreitar por cima de uma borda (a imagem tem o corte inferior recto) → só pousada numa borda:
  // topo do rodapé, base de um painel, base de um cartão de boas-vindas.
  mascotPeek: u("mascote-espreitar"),
  // Festa/confetes → algo correu bem: encomenda criada/entregue, convite aceite.
  mascotCelebrate: u("mascote-celebrar"),
  // Encolhe os ombros, ponto de interrogação → página/produto não encontrado, lista vazia, erro.
  mascotConfused: u("mascote-confuso"),
  // Telemóvel com visto + polegar para cima → PAGAMENTO (escolher o método, pagamento confirmado).
  mascotPayment: u("mascote-pagamento"),
  // Só o chat usa estas duas (mascote com o balão de conversa): nenhuma outra parte do site as repete.
  mascotSupport: u("mascote-suporte"),
  mascotSupportAvatar: u("mascote-suporte-avatar"),
  // Objectos 3D: cada um representa uma coisa concreta.
  cart: u("obj-carrinho"),      // carrinho (vazio, carrinho de compras)
  box: u("obj-caixa"),          // caixa a voar → envio / acompanhar encomenda
  bag: u("obj-saco"),           // saco de compras → "as minhas compras" (ainda sem uso)
  phone: u("obj-telemovel"),    // ecrã da APP → só na página de instalar (nunca como símbolo de pagamento)
  tag: u("obj-etiqueta"),       // etiqueta de preço → preços, descontos, campanhas (não serve para documentos legais)
  shield: u("obj-escudo"),      // escudo com visto → segurança e privacidade (pagamento seguro, privacidade, cookies, área restrita)
  // Fundos
  patternCapulana: u("fundo-capulana"),   // padrão tradicional: faixa decorativa do rodapé (imagem única, tem costura)
  heroBackdrop: u("fundo-hero"),          // fitas vermelhas: painéis de marca (entrar/registar, admin)
  profileCover: u("fundo-capa-perfil")    // capa do perfil
};
