const BASE_URL = '/api/v1';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedCallback(cb: () => void) {
  onUnauthorized = cb;
}

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      onUnauthorized?.();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  auth: {
    register: (body: { email: string; displayName: string; password: string; role: string }) =>
      api.post<{ accessToken: string; refreshToken: string; expiresIn: number; user: UserInfo }>('/auth/register', body),
    login: (body: { email: string; password: string }) =>
      api.post<{ accessToken: string; refreshToken: string; expiresIn: number; user: UserInfo }>('/auth/login', body),
    logout: (refreshToken: string) =>
      api.post<{ success: boolean }>('/auth/logout', { refreshToken }),
    me: () => api.get<UserInfo>('/me'),

    storeTokens,
    clearTokens,
    getAccessToken,
  },
};

export interface UserInfo {
  sub: string;
  email: string;
  displayName: string;
  role: string;
  organizationId?: string | null;
}
