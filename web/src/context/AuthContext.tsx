import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse } from "../types";
import { loginRequest, registerRequest } from "../api/client";

const STORAGE_KEY = "aprovati_auth";
const SESSION_EXPIRED_EVENT = "aprovati:session-expired";

type AuthContextValue = {
  auth: AuthResponse | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  token: string | null;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredAuth(): AuthResponse | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(() => loadStoredAuth());
  const [loading, setLoading] = useState(false);

  const persist = useCallback((value: AuthResponse) => {
    setAuth(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }, []);

  const login = useCallback(
    async (email: string, senha: string) => {
      setLoading(true);
      try {
        const logged = await loginRequest(email, senha);
        persist(logged);
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const register = useCallback(
    async (nome: string, email: string, senha: string) => {
      setLoading(true);
      try {
        const created = await registerRequest(nome, email, senha);
        persist(created);
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    function onSessionExpired() {
      setAuth(null);
      localStorage.removeItem(STORAGE_KEY);
      const currentPath = window.location.pathname;
      const from =
        currentPath.startsWith("/app") || currentPath.startsWith("/admin")
          ? currentPath
          : "/app/dashboard";
      const sp = new URLSearchParams({
        expired: "1",
        from,
      });
      window.location.assign(`/login?${sp.toString()}`);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const value = useMemo(
    () => ({
      auth,
      loading,
      login,
      register,
      logout,
      token: auth?.accessToken ?? null,
      isAdmin: auth?.role === "ADMIN",
      hasActiveSubscription:
        auth?.role === "ADMIN" ||
        auth?.subscriptionStatus === "ACTIVE" ||
        auth?.subscriptionStatus === "TRIALING",
    }),
    [auth, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
