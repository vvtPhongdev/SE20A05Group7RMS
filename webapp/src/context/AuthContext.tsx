import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, UserInfo, setUnauthorizedCallback, clearTokens } from '../lib/api-client';

interface AuthContextValue {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, displayName: string, password: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    const token = api.auth.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.auth
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    api.auth.storeTokens(res.accessToken, res.refreshToken);
    const me = await api.auth.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await api.auth.logout(refreshToken).catch(() => {});
    }
    clearTokens();
    setUser(null);
  }, []);

  const register = useCallback(async (email: string, displayName: string, password: string, role: string) => {
    const res = await api.auth.register({ email, displayName, password, role });
    api.auth.storeTokens(res.accessToken, res.refreshToken);
    const me = await api.auth.me();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
