// Grupo de WhatsApp de novidades. O link vem de VITE_WHATSAPP_GROUP_URL (https://chat.whatsapp.com/...).
// Sem link válido, o cartão de boas-vindas aparece na mesma, só sem o botão do grupo.
const raw = import.meta.env.VITE_WHATSAPP_GROUP_URL;
export const WHATSAPP_GROUP_URL: string | null =
  typeof raw === "string" && /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(raw.trim()) ? raw.trim() : null;

/** Quem acabou de criar conta deixa esta marca; o cartão de boas-vindas mostra-se uma vez e apaga-a. */
export const WELCOME_FLAG = "twisisa.welcome.pending";
