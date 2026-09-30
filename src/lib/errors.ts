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
