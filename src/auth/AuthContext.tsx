import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { AuthUser } from "../lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "twisisa.token";
const USER_KEY = "twisisa.user";

// NOTA DE SEGURANÇA: o token fica em localStorage para esta primeira entrega (simples, sem backend
// próprio de sessão). Para produção o ideal é um cookie httpOnly emitido por um pequeno servidor
// proxy — fica documentado no README como próximo passo, não implementado agora.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      try { setUser(JSON.parse(storedUser)); } catch { /* ignora utilizador inválido guardado */ }
    }
    setLoading(false);
  }, []);

  function persist(nextUser: AuthUser, nextToken: string) {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  async function login(email: string, password: string) {
    const res = await api.auth.login({ email, password });
    persist(res.user, res.accessToken);
    return res.user;
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const res = await api.auth.register({ name, email, password, phone });
    persist(res.user, res.accessToken);
    return res.user;
  }

  function logout() {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }

  const value = useMemo<AuthContextValue>(() => ({
    user, token, loading,
    isAdmin: Boolean(user?.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN")),
    login, register, logout
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
