// Tema da aplicação. Por defeito SEGUE O SISTEMA (claro/escuro do telemóvel ou do computador) e muda sozinho
// quando o sistema muda. A escolha manual ("light" | "dark") guarda-se em localStorage; "system" = sem valor guardado.
// Sem preferência do sistema (ou sem suporte), mantém-se o escuro da marca.
// O index.html corre a mesma lógica antes da primeira pintura para não piscar; manter as duas iguais.
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const KEY = "twisisa:theme";
const META_COLOR: Record<ResolvedTheme, string> = { dark: "#140F0E", light: "#F8F9FB" };
const QUERY = "(prefers-color-scheme: light)";

function readStored(): ThemePreference {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch { return "system"; }
}

// Em memória para que a escolha se mantenha nesta sessão mesmo sem armazenamento disponível.
let current: ThemePreference | null = null;

export function getThemePreference(): ThemePreference {
  if (current === null) current = readStored();
  return current;
}

export function resolveTheme(pref: ThemePreference = getThemePreference()): ResolvedTheme {
  if (pref !== "system") return pref;
  try { return window.matchMedia(QUERY).matches ? "light" : "dark"; } catch { return "dark"; }
}

export function applyTheme(pref: ThemePreference = getThemePreference()): ResolvedTheme {
  const theme = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[theme]);
  return theme;
}

export function setThemePreference(next: ThemePreference): void {
  current = next;
  try {
    if (next === "system") window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, next);
  } catch { /* sem armazenamento: vale só nesta sessão */ }
  applyTheme(next);
}

/** Chamar uma vez ao arrancar: aplica o tema e acompanha o sistema e os outros separadores. */
export function initTheme(): void {
  applyTheme();
  try {
    const mq = window.matchMedia(QUERY);
    const onSystemChange = () => { if (getThemePreference() === "system") applyTheme(); };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", onSystemChange);
    else mq.addListener(onSystemChange); // Safari antigo
  } catch { /* sem matchMedia: fica o escuro */ }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY && e.key !== null) return;
    current = readStored();
    applyTheme();
  });
}
