/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Base das imagens de estilo (ex.: URL do Cloudinary). Se vazio, usa /img (ficheiros em public/img). */
  readonly VITE_ASSETS_URL?: string;
  /** URL público do site (canonical, partilhas, sitemap). Por omissão o domínio da Vercel. */
  readonly VITE_SITE_URL?: string;
  /** Link do grupo de WhatsApp de novidades (https://chat.whatsapp.com/...). Sem ele, o cartão de boas-vindas não mostra o botão do grupo. */
  readonly VITE_WHATSAPP_GROUP_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
