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
  phone?: string | null;
  department?: UserDepartment | null;
  departmentsHeaded?: UserDepartment[];
}

interface SupabaseRegisterData {
  displayName: string;
  invitationCode?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  signInWithGoogle: (redirectPath?: string, rememberMe?: boolean) => Promise<void>;
  registerWithGoogle: (data: { signupToken: string; displayName: string; invitationCode?: string }) => Promise<User>;
  completeSupabaseLogin: (rememberMe?: boolean) => Promise<User>;
  registerWithSupabaseSession: (data: SupabaseRegisterData) => Promise<{ success: boolean; email: string }>;
  getSupabaseProfile: () => Promise<{ email: string; displayName: string } | null>;
  loginWithToken: (
    accessToken: string,
    loggedUser: User,
    refreshToken?: string,
    rememberMe?: boolean,
  ) => void;
  updateCurrentUser: (updatedUser: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_LOGOUT_EVENT_KEY = 'authLogoutAt';
const PENDING_REMEMBER_ME_KEY = 'rms_pending_remember_me';
const MOCK_AUTH_STORAGE_KEY = 'rms_mock_auth';
let ignoreNextSupabaseSignOut = false;

const storeMockAuth = (accessToken: string, loggedUser: User, rememberMe: boolean) => {
  if (!rememberMe) {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify({ accessToken, loggedUser }));
};

const getStoredMockAuth = (): { accessToken: string; loggedUser: User } | null => {
  try {
    const value = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
    if (!value) return null;
    const stored = JSON.parse(value) as { accessToken?: string; loggedUser?: User };
    return stored.accessToken && stored.loggedUser ? { accessToken: stored.accessToken, loggedUser: stored.loggedUser } : null;
  } catch {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return null;
  }
};

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

const revokeRefreshSession = async () => {
  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    });

    if (!response.ok) {
      console.warn(`Server logout failed after local session was cleared: ${response.status}`);
    }
  } catch (err) {
    console.warn('Server logout failed after local session was cleared:', err);
  }
};

const mapAuthUser = (data: AuthResponse): User => ({
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

const shouldClearSupabaseSession = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const { status, code } = error as { status?: number; code?: string };
  return (
    status === 401 ||
    code === 'bad_jwt' ||
    code === 'invalid_jwt' ||
    code === 'refresh_token_not_found' ||
    code === 'refresh_token_already_used'
  );
};

const getPendingRememberMe = () => sessionStorage.getItem(PENDING_REMEMBER_ME_KEY) === 'true';

const getTokenExpiry = (accessToken: string) => {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
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

  const saveAuthResponse = async (data: AuthResponse) => {
    let loggedUser = mapAuthUser(data);
    try {
      const profileResponse = await fetch('/api/v1/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      if (profileResponse.ok) {
        loggedUser = { ...loggedUser, ...(await profileResponse.json()) } as User;
      }
    } catch {
      // The login payload remains sufficient for routing if profile hydration is unavailable.
    }
    setToken(data.accessToken);
    setUser(loggedUser);
    return loggedUser;
  };

  const exchangeSupabaseToken = async (accessToken: string, rememberMe = false) => {
    const response = await fetch('/api/v1/auth/supabase-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, rememberMe }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw await readAuthError(response);
    }

    const loggedUser = await saveAuthResponse(await response.json());
    ignoreNextSupabaseSignOut = true;
    await clearSupabaseSession('local');
    return loggedUser;
  };

  const refreshRmsSession = async () => {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) return null;
    return saveAuthResponse(await response.json());
  };

  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const refreshDelay = Math.max(0, expiry - Date.now() - 60_000);
    const timeout = window.setTimeout(() => {
      void refreshRmsSession().then((refreshedUser) => {
        if (!refreshedUser) {
          setToken(null);
          setUser(null);
        }
      });
    }, refreshDelay);

    return () => window.clearTimeout(timeout);
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const restoreSupabaseAuth = async () => {
      try {
        if (new URLSearchParams(window.location.search).get('auth') !== 'google') {
          const restoredUser = await refreshRmsSession();
          if (restoredUser) return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.access_token) {
          if (shouldClearSupabaseSession(error)) {
            await clearSupabaseSession();
          }
          const storedMockAuth = getStoredMockAuth();
          setToken(storedMockAuth?.accessToken ?? null);
          setUser(storedMockAuth?.loggedUser ?? null);
          return;
        }

        // Let the callback pages exchange this session exactly once. In particular,
        // a new Google account must retain its Supabase session while SignUp creates
        // the corresponding RMS account after a 404 from /supabase-login.
        if (new URLSearchParams(window.location.search).get('auth') === 'google') {
          return;
        }

        await exchangeSupabaseToken(data.session.access_token, getPendingRememberMe());
      } catch (error) {
        if (shouldClearSupabaseSession(error)) {
          await clearSupabaseSession();
        }
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === AUTH_LOGOUT_EVENT_KEY) {
        setToken(null);
        setUser(null);
        return;
      }

    };

    void restoreSupabaseAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (ignoreNextSupabaseSignOut) {
          ignoreNextSupabaseSignOut = false;
          return;
        }
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
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      });

      if (response.ok) {
        return saveAuthResponse(await response.json());
      }

      const rmsAuthError = await readAuthError(response);
      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (mockUser && password === 'Password123!') {
        const mockToken = `mock-jwt-token-for-${mockUser.role}`;
        storeMockAuth(mockToken, mockUser, rememberMe);
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
        storeMockAuth(mockToken, mockUser, rememberMe);
        setToken(mockToken);
        setUser(mockUser);
        return mockUser;
      }

      throw err instanceof Error ? err : new Error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (redirectPath = '/login?auth=google', rememberMe = false) => {
    sessionStorage.setItem(PENDING_REMEMBER_ME_KEY, rememberMe.toString());
    
    // If the redirectPath includes an inviteCode parameter, let's store it in sessionStorage
    // so we can retrieve it on signup redirection
    if (redirectPath.includes('inviteCode=')) {
      const inviteCodeMatch = redirectPath.match(/[?&]inviteCode=([^&]+)/);
      if (inviteCodeMatch?.[1]) {
        sessionStorage.setItem('pending_invite_code', decodeURIComponent(inviteCodeMatch[1]));
      }
    }

    const origin = window.location.origin;
    window.location.href = `/api/v1/auth/google?redirect=${encodeURIComponent(origin)}`;
  };

  const registerWithGoogle = async (data: { signupToken: string; displayName: string; invitationCode?: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/google-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await readAuthError(response);
      }

      return await saveAuthResponse(await response.json());
    } finally {
      setLoading(false);
    }
  };

  const completeSupabaseLogin = async (rememberMe = getPendingRememberMe()): Promise<User> => {
    setLoading(true);

    try {
      // First try getSession() — if Supabase already processed the hash it'll be ready.
      const { data: immediate, error: immediateError } = await supabase.auth.getSession();
      if (!immediateError && immediate.session?.access_token) {
        const loggedUser = await exchangeSupabaseToken(immediate.session.access_token, rememberMe);
        sessionStorage.removeItem(PENDING_REMEMBER_ME_KEY);
        return loggedUser;
      }

      // If no session yet, wait for the SIGNED_IN event (Supabase processes the
      // #access_token hash asynchronously after page load).
      const accessToken = await new Promise<string>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          subscription.unsubscribe();
          reject(new Error('Supabase session was not found.'));
        }, 10_000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
            window.clearTimeout(timer);
            subscription.unsubscribe();
            resolve(session.access_token);
          }
        });
      });

      const loggedUser = await exchangeSupabaseToken(accessToken, rememberMe);
      sessionStorage.removeItem(PENDING_REMEMBER_ME_KEY);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const registerWithSupabaseSession = async ({
    displayName,
    invitationCode,
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
          invitationCode,
        }),
      });

      if (!response.ok) {
        throw await readAuthError(response);
      }

      return (await response.json()) as { success: boolean; email: string };
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
    void refreshToken;
    void rememberMe;
    setToken(accessToken);
    setUser(loggedUser);
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const logout = async () => {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    setToken(null);
    setUser(null);

    localStorage.setItem(AUTH_LOGOUT_EVENT_KEY, Date.now().toString());
    localStorage.removeItem(AUTH_LOGOUT_EVENT_KEY);

    await Promise.allSettled([revokeRefreshSession(), revokeSupabaseSession()]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signInWithGoogle,
        registerWithGoogle,
        completeSupabaseLogin,
        registerWithSupabaseSession,
        getSupabaseProfile,
        loginWithToken,
        updateCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
