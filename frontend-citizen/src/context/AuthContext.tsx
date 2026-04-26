import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  points: number;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = useCallback((data: TokenResponse) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));

      // Verify the token is still valid
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then(async (res) => {
          if (res.ok) {
            const data: TokenResponse = await res.json();
            saveSession(data);
          } else {
            clearSession();
          }
        })
        .catch(() => clearSession())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [saveSession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.[0]?.msg || data.detail || 'Login failed');
      }

      saveSession(data);
    },
    [saveSession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.[0]?.msg || data.detail || 'Registration failed');
      }

      saveSession(data);
    },
    [saveSession],
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Ignore errors — we clear locally regardless
    }
    clearSession();
  }, [token, clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
