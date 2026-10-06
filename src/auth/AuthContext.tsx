import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { AuthUser } from "../lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** A ler a sessão guardada no dispositivo (instantâneo). */
  loading: boolean;
  /** O servidor confirmou a sessão guardada (papéis incluídos). Sem sessão, um visitante conta como confirmado. */
  verified: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone?: string, referralCode?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "twisisa.token";
const USER_KEY = "twisisa.user";
const REVERIFY_MS = 60_000;

// NOTA DE SEGURANÇA: o token fica em localStorage (simples, sem backend próprio de sessão). Para produção o ideal
// é um cookie httpOnly emitido por um pequeno servidor proxy — fica como próximo passo, não implementado.
// O que o localStorage diz sobre papéis NUNCA é de confiança: o utilizador pode editá-lo. Por isso a sessão é
// confirmada no servidor (GET /auth/me) ao abrir a app e quando o separador volta a ficar visível, e a área
// de administração só abre depois dessa confirmação (`verified`). O backend impõe sempre as permissões reais.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const lastCheck = useRef(0);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setVerified(true);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }, []);

  const verify = useCallback(async (tokenValue: string) => {
    lastCheck.current = Date.now();
    try {
      const fresh = await api.auth.me(tokenValue);
      const next: AuthUser = { id: fresh.id, name: fresh.name, email: fresh.email, roles: fresh.roles };
      setUser(next);
      window.localStorage.setItem(USER_KEY, JSON.stringify(next));
      setVerified(true);
    } catch (err) {
      // Token recusado, conta restrita ou utilizador inexistente: a sessão acaba aqui.
      // Sem rede ou erro do servidor: mantém a sessão, mas sem `verified` (o admin não abre até confirmar).
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) logout();
    }
  }, [logout]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
        setToken(storedToken);
        void verify(storedToken);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setVerified(true);
      }
    } else {
      setVerified(true);
    }
    setLoading(false);
  }, [verify]);

  useEffect(() => {
    window.addEventListener("twisisa:unauthorized", logout);
    return () => window.removeEventListener("twisisa:unauthorized", logout);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > REVERIFY_MS) void verify(token);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [token, verify]);

  function persist(nextUser: AuthUser, nextToken: string) {
    setUser(nextUser);
    setToken(nextToken);
    setVerified(true);
    lastCheck.current = Date.now();
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  async function login(email: string, password: string) {
    const res = await api.auth.login({ email, password });
    persist(res.user, res.accessToken);
    return res.user;
  }

  async function register(name: string, email: string, password: string, phone?: string, referralCode?: string) {
    const res = await api.auth.register({ name, email, password, phone, referralCode });
    persist(res.user, res.accessToken);
    return res.user;
  }

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading, verified,
    isAdmin: Boolean(user?.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN")),
    login, register, logout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, token, loading, verified, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
