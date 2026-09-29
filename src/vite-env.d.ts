/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Base das imagens de estilo (ex.: URL do Cloudinary). Se vazio, usa /img (ficheiros em public/img). */
  readonly VITE_ASSETS_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
