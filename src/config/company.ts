// Dados da empresa. Deixe vazio o que ainda não existe: o rodapé e as páginas legais só mostram
// o que estiver preenchido, para não publicar contactos ou identificação inventados.
export const COMPANY = {
  name: "Twisisa Market",
  legalName: "",   // ex.: "Twisisa, Lda."
  nuit: "",
  email: "",
  phone: "",
  address: "",
  social: {} as Record<string, string> // ex.: { Facebook: "https://...", Instagram: "https://..." }
};
