interface RequestOptions extends RequestInit {
  body?: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const BASE_URL = '/api/v1';

// Global promise to deduplicate concurrent refresh token API calls
let refreshPromise: Promise<string> | null = null;

async function executeRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Use raw fetch to avoid interceptor recursion
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Refresh token invalid or expired');
  }

  const data = await response.json();
  if (!data.accessToken || !data.refreshToken) {
    throw new Error('Invalid token response');
  }

  // Update storage
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  if (data.user) {
    // Sync user details if refreshed payload contains them
    const userPayload = {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
      organizationId: data.user.organizationId,
    };
    localStorage.setItem('user', JSON.stringify(userPayload));
  }

  return data.accessToken;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') || path.startsWith('/api/')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers || {});
  
  // Inject JWT if available
  const token = localStorage.getItem('token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Default content-type to application/json for payloads that are not string or FormData
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    options.body = JSON.stringify(options.body);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If 401 and we are not using a mock token, attempt refresh
    if (response.status === 401 && token && !token.startsWith('mock-')) {
      try {
        if (!refreshPromise) {
          refreshPromise = executeRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        
        const newAccessToken = await refreshPromise;
        
        // Retry with new token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(url, fetchOptions);
      } catch (refreshErr) {
        console.error('Session expired, logging out:', refreshErr);
        // Clear credentials and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
        throw new ApiError('Session expired. Please log in again.', 401);
      }
    }

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      
      const errorMessage = errorData?.message || response.statusText || 'An API error occurred';
      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    
    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 0);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
