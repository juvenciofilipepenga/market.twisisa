// Permite abrir o chat de suporte a partir de qualquer sítio (ex.: rodapé) sem passar props
// nem importar o ChatWidget (que é carregado sob demanda).
export const OPEN_CHAT_EVENT = "twisisa:open-chat";

export function openChat(): void {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}
