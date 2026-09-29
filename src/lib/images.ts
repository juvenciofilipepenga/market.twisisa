// Ponto único das imagens de estilo do site (mascote, objectos 3D, fundos).
// Por omissão vêm de public/img. Para passar ao Cloudinary basta definir VITE_ASSETS_URL
// (ex.: https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/twisisa) e carregar lá
// os mesmos nomes de ficheiro — nenhum componente precisa de mudar.
const BASE = (import.meta.env.VITE_ASSETS_URL ?? "/img").replace(/\/$/, "");
const u = (name: string) => `${BASE}/${name}.webp`;

export const img = {
  mascotDelivery: u("mascote-entrega"),
  mascotPeek: u("mascote-espreitar"),
  mascotCelebrate: u("mascote-celebrar"),
  mascotConfused: u("mascote-confuso"),
  mascotPayment: u("mascote-pagamento"),
  cart: u("obj-carrinho"),
  box: u("obj-caixa"),
  bag: u("obj-saco"),
  phone: u("obj-telemovel"),
  tag: u("obj-etiqueta"),
  shield: u("obj-escudo"),
  patternCapulana: u("fundo-capulana"),
  heroBackdrop: u("fundo-hero"),
  profileCover: u("fundo-capa-perfil")
};
