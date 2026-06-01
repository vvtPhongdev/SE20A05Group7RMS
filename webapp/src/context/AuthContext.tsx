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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Predefined mock users for quick UI evaluation
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
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

        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setToken(data.accessToken);
        setUser(loggedUser);
        return;
      }
    } catch (err) {
      console.warn('API connection failed, falling back to mock authentication:', err);
    }

    // 2. Mock Fallback
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && password === 'Password123!') {
      const mockToken = `mock-jwt-token-for-${mockUser.role}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      setLoading(false);
      return;
    }

    setLoading(false);
    throw new Error('Invalid email or password');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
