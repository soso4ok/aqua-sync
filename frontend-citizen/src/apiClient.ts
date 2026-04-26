const API_BASE = '/api/v1';

/**
 * Centralized fetch wrapper that auto-attaches the JWT token
 * and handles 401 refresh logic.
 */
export async function apiClient(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  let res = await fetch(url, { ...options, headers });

  // If 401, attempt token refresh
  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem('access_token');
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

/**
 * Helper for JSON POST/PUT requests.
 */
export async function apiJson<T = unknown>(
  path: string,
  body: unknown,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<T> {
  const res = await apiClient(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail?.[0]?.msg || err.detail || 'Request failed');
  }
  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return false;
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return true;
  } catch {
    return false;
  }
}
