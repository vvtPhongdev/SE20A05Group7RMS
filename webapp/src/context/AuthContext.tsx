import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@wr/contracts';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  loginWithToken: (
    accessToken: string,
    loggedUser: User,
    refreshToken?: string,
    rememberMe?: boolean,
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEYS = ['token', 'accessToken', 'refreshToken', 'user'] as const;
const AUTH_LOGOUT_EVENT_KEY = 'authLogoutAt';

const clearStoredAuth = () => {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

const storeAuth = (
  accessToken: string,
  loggedUser: User,
  refreshToken?: string,
  rememberMe = false,
) => {
  clearStoredAuth();

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', accessToken);
  storage.setItem('user', JSON.stringify(loggedUser));
  if (refreshToken) {
    storage.setItem('refreshToken', refreshToken);
  }
};

const getStoredAuth = () => {
  for (const storage of [sessionStorage, localStorage]) {
    const accessToken = storage.getItem('token') ?? storage.getItem('accessToken');
    const savedUser = storage.getItem('user');

    if (accessToken && savedUser) {
      return { accessToken, savedUser };
    }
  }

  return null;
};

const getStoredRefreshToken = () =>
  sessionStorage.getItem('refreshToken') ?? localStorage.getItem('refreshToken');

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/*
 * Mock users retained for local UI reference only. Authentication must use the API gateway.
const MOCK_USERS: Record<string, User> = {
  'admin@acme.com': {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@acme.com',
    displayName: 'System Admin',
    role: UserRole.ADMIN,
    organizationId: 'org-uuid-1234',
  },
  'depthead@acme.com': {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'depthead@acme.com',
    displayName: 'Trưởng Phòng ENG',
    role: UserRole.DEPARTMENT_HEAD,
    organizationId: 'org-uuid-1234',
  },
  'hr@acme.com': {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'hr@acme.com',
    displayName: 'HR Manager',
    role: UserRole.HR_MANAGER,
    organizationId: 'org-uuid-1234',
  },
  'candidate@acme.com': {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'candidate@acme.com',
    displayName: 'Nguyễn Văn Ứng Viên',
    role: UserRole.CANDIDATE,
    organizationId: 'org-uuid-1234',
  },
};
*/

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreStoredAuth = () => {
      const savedAuth = getStoredAuth();

      if (!savedAuth) {
        setToken(null);
        setUser(null);
        return;
      }

      try {
        setToken(savedAuth.accessToken);
        setUser(JSON.parse(savedAuth.savedUser) as User);
      } catch {
        clearStoredAuth();
        setToken(null);
        setUser(null);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === AUTH_LOGOUT_EVENT_KEY) {
        clearStoredAuth();
        setToken(null);
        setUser(null);
        return;
      }

      const isAuthKey = AUTH_STORAGE_KEYS.some((key) => key === event.key);
      if (event.storageArea === localStorage && isAuthKey) {
        restoreStoredAuth();
      }
    };

    restoreStoredAuth();
    setLoading(false);

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setLoading(true);
    try {
      // 1. Try to hit actual login endpoint in the gateway
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const loggedUser: User = {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName,
          role: data.user.role,
          organizationId: data.user.organizationId,
        };

        storeAuth(data.accessToken, loggedUser, data.refreshToken, rememberMe);
        setToken(data.accessToken);
        setUser(loggedUser);
        setLoading(false);
        return loggedUser;
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed (${response.status})`);
    } catch (err) {
      setLoading(false);
      throw err instanceof Error ? err : new Error('Invalid email or password');
    }
  };

  const loginWithToken = (
    accessToken: string,
    loggedUser: User,
    refreshToken?: string,
    rememberMe = false,
  ) => {
    storeAuth(accessToken, loggedUser, refreshToken, rememberMe);
    setToken(accessToken);
    setUser(loggedUser);
  };

  const logout = () => {
    const refreshToken = getStoredRefreshToken();

    clearStoredAuth();
    localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, Date.now().toString());
    setToken(null);
    setUser(null);

    if (refreshToken) {
      void fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok) {
            console.warn(`Server logout failed with status ${response.status}`);
          }
        })
        .catch((err) => {
          console.warn('Server logout failed after local session was cleared:', err);
        });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
