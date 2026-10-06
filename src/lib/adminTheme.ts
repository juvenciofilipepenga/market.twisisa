import { useEffect, useState } from "react";

// Cor de destaque do painel de administração. Só vale dentro do admin (a loja mantém o vermelho da marca):
// o AdminShell aplica estas variáveis a <html> enquanto está aberto (modais e avisos vivem fora do seu contentor) e
// remove-as ao sair; o Tailwind (ver tailwind.config.ts) lê-as.
export interface AdminAccent { id: string; label: string; primary: string; hover: string; active: string; text: string }

export const ACCENTS: AdminAccent[] = [
  { id: "twisisa", label: "Vermelho Twisisa", primary: "238 0 6", hover: "255 42 47", active: "196 0 5", text: "255 98 89" },
  { id: "laranja", label: "Laranja", primary: "234 88 12", hover: "249 115 22", active: "194 65 12", text: "251 146 60" },
  { id: "azul", label: "Azul", primary: "37 99 235", hover: "59 130 246", active: "29 78 216", text: "96 165 250" },
  { id: "verde", label: "Verde", primary: "5 150 105", hover: "16 185 129", active: "4 120 87", text: "52 211 153" },
  { id: "violeta", label: "Violeta", primary: "124 58 237", hover: "139 92 246", active: "109 40 217", text: "167 139 250" }
];

const KEY = "twisisa.admin.accent";

export function accentVars(a: AdminAccent): Record<string, string> {
  return { "--c-primary": a.primary, "--c-primary-hover": a.hover, "--c-primary-active": a.active, "--c-primary-text": a.text };
}

export function useAdminAccent(): [AdminAccent, (id: string) => void] {
  const [id, setId] = useState("twisisa");
  useEffect(() => {
    try { const stored = window.localStorage.getItem(KEY); if (stored && ACCENTS.some((a) => a.id === stored)) setId(stored); } catch { /* sem armazenamento: usa a cor da marca */ }
  }, []);
  function choose(next: string) {
    setId(next);
    try { window.localStorage.setItem(KEY, next); } catch { /* só não persiste */ }
  }
  return [ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]!, choose];
}
