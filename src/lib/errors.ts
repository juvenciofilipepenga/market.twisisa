import { ApiError } from "./api";

// Traduz erros do backend em frases que o cliente entende (nunca mostra códigos técnicos).
export function friendlyError(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return t("auth.invalidCredentials");
    if (err.status === 409) return t("auth.emailTaken");
    if (err.status === 429) return t("common.tooMany");
  }
  return t("common.error");
}

// Só aceita caminhos internos (evita redirecionar para outro site através de ?next=).
export function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

// Erros do painel de administração: código do backend → frase clara (nunca "PRODUCT_HAS_ORDERS" em ecrã).
export function adminError(err: unknown, t: (key: string) => string): string {
  // Também aceita um Error cujo texto é um código conhecido (o formulário valida variantes antes de enviar).
  const code = err instanceof ApiError ? err.code : err instanceof Error ? err.message : null;
  if (code) {
    const key = `admin.err.${code}`;
    const message = t(key);
    if (message !== key) return message;
  }
  if (err instanceof ApiError && err.status === 403) return t("admin.err.FORBIDDEN");
  return t("common.error");
}

/** Tradução opcional: devolve o texto da chave, ou `fallback` se ela não existir (ex.: estado novo no backend). */
export function labelOr(t: (key: string) => string, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}
