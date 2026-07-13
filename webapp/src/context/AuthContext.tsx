import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from '@wr/contracts';
import { supabase } from '../lib/supabase';

export interface UserDepartment {
  id: string;
  name: string;
  code?: string | null;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  departmentId?: string | null;
  department?: UserDepartment | null;
  departmentsHeaded?: UserDepartment[];
}

interface SupabaseRegisterData {
  displayName: string;
  role: UserRole;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  completeSupabaseLogin: (rememberMe?: boolean) => Promise<User>;
  registerWithSupabaseSession: (data: SupabaseRegisterData) => Promise<User>;
  getSupabaseProfile: () => Promise<{ email: string; displayName: string } | null>;
  loginWithToken: (
    accessToken: string,
    loggedUser: User,
    refreshToken?: string,
    rememberMe?: boolean,
  ) => void;
  logout: () => Promise<void>;
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

const clearSupabaseSession = async (scope: 'global' | 'local' | 'others' = 'local') => {
  await supabase.auth.signOut({ scope }).catch(() => undefined);
};

const revokeSupabaseSession = async () => {
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (!error) return;

    console.warn('Supabase session revoke failed; clearing local Supabase session instead:', error);
  } catch (err) {
    console.warn('Supabase session revoke failed; clearing local Supabase session instead:', err);
  }

  await clearSupabaseSession('local');
};

const revokeStoredRefreshToken = async (refreshToken: string | null) => {
  if (!refreshToken) return;

  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      keepalive: true,
    });

    if (!response.ok) {
      console.warn(`Server logout failed after local session was cleared: ${response.status}`);
    }
  } catch (err) {
    console.warn('Server logout failed after local session was cleared:', err);
  }
};

const mapAuthUser = (data: any): User => ({
  id: data.user.id,
  email: data.user.email,
  displayName: data.user.displayName,
  role: data.user.role,
  organizationId: data.user.organizationId,
  departmentId: data.user.departmentId,
  department: data.user.department,
  departmentsHeaded: data.user.departmentsHeaded,
});

const readAuthError = async (response: Response) => {
  const errorData = await response.json().catch(() => ({}));
  const error = new Error(
    errorData.message || `Authentication failed (${response.status})`,
  ) as Error & {
    status?: number;
    code?: string;
    email?: string;
  };
  error.status = response.status;
  error.code = errorData.code;
  error.email = errorData.email;
  return error;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
    displayName: 'Department Head ENG',
    role: UserRole.DEPARTMENT_HEAD,
    organizationId: 'org-uuid-1234',
    department: {
      id: '00000000-0000-4000-8000-000000000201',
      name: 'Engineering',
      code: 'ENG',
    },
  },
  'sale.head.test@gmail.com': {
    id: '00000000-0000-4000-8000-000000000109',
    email: 'sale.head.test@gmail.com',
    displayName: 'FONG',
    role: UserRole.DEPARTMENT_HEAD,
    organizationId: 'org-uuid-1234',
    department: {
      id: '00000000-0000-4000-8000-000000000203',
      name: 'Sales',
      code: 'SALES',
    },
  },
  'hr@acme.com': {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'hr@acme.com',
    displayName: 'HR Manager',
    role: UserRole.HR_LEADER,
    organizationId: 'org-uuid-1234',
  },
  'candidate@acme.com': {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'candidate@acme.com',
    displayName: 'Candidate User',
    role: UserRole.CANDIDATE,
    organizationId: 'org-uuid-1234',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const saveAuthResponse = (data: any, rememberMe = false) => {
    const loggedUser = mapAuthUser(data);
    storeAuth(data.accessToken, loggedUser, data.refreshToken, rememberMe);
    setToken(data.accessToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const exchangeSupabaseToken = async (accessToken: string, rememberMe = false) => {
    const response = await fetch('/api/v1/auth/supabase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (!response.ok) {
      throw await readAuthError(response);
    }

    return saveAuthResponse(await response.json(), rememberMe);
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSupabaseAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.access_token) {
          if (error) {
            await clearSupabaseSession();
          }
          restoreStoredAuth();
          return;
        }

        await exchangeSupabaseToken(data.session.access_token);
      } catch {
        await clearSupabaseSession();
        if (!cancelled) {
          restoreStoredAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

    void restoreSupabaseAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearStoredAuth();
        setToken(null);
        setUser(null);
      }
    });

    window.addEventListener('storage', handleStorageChange);
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        return saveAuthResponse(await response.json(), rememberMe);
      }

      const rmsAuthError = await readAuthError(response);
      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (mockUser && password === 'Password123!') {
        const mockToken = `mock-jwt-token-for-${mockUser.role}`;
        storeAuth(mockToken, mockUser, undefined, rememberMe);
        setToken(mockToken);
        setUser(mockUser);
        return mockUser;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session?.access_token) {
        throw rmsAuthError;
      }

      return await exchangeSupabaseToken(data.session.access_token, rememberMe);
    } catch (err) {
      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (mockUser && password === 'Password123!') {
        const mockToken = `mock-jwt-token-for-${mockUser.role}`;
        storeAuth(mockToken, mockUser, undefined, rememberMe);
        setToken(mockToken);
        setUser(mockUser);
        return mockUser;
      }

      throw err instanceof Error ? err : new Error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (redirectPath = '/login?auth=google') => {
    const redirectTo = `${window.location.origin}${redirectPath}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const completeSupabaseLogin = async (rememberMe = false) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        throw new Error(error?.message || 'Supabase session was not found.');
      }

      return await exchangeSupabaseToken(data.session.access_token, rememberMe);
    } finally {
      setLoading(false);
    }
  };

  const registerWithSupabaseSession = async ({
    displayName,
    role,
    rememberMe = false,
  }: SupabaseRegisterData) => {
    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error(sessionError?.message || 'Supabase session was not found.');
      }

      const response = await fetch('/api/v1/auth/supabase-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: sessionData.session.access_token,
          displayName,
          role,
        }),
      });

      if (!response.ok) {
        throw await readAuthError(response);
      }

      return saveAuthResponse(await response.json(), rememberMe);
    } finally {
      setLoading(false);
    }
  };

  const getSupabaseProfile = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) {
      return null;
    }

    const metadata = data.user.user_metadata ?? {};
    const displayName =
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : data.user.email;

    return {
      email: data.user.email,
      displayName,
    };
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

  const logout = async () => {
    const refreshToken = getStoredRefreshToken();

    clearStoredAuth();
    setToken(null);
    setUser(null);

    localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, Date.now().toString());
    localStorage.removeItem(AUTH_LOGOUT_EVENT_KEY);

    await Promise.allSettled([
      revokeStoredRefreshToken(refreshToken),
      revokeSupabaseSession(),
    ]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signInWithGoogle,
        completeSupabaseLogin,
        registerWithSupabaseSession,
        getSupabaseProfile,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
