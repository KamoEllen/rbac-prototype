import { createContext, useContext, useState, useEffect } from 'react';
import type {  ReactNode } from 'react';
import type  {  User } from '../lib/api';
import { api, setSessionToken, clearSessionToken } from '../lib/api';

interface Permissions {
  vault: string[];
  financials: string[];
  reporting: string[];
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions | null;
  loading: boolean;
  login: (email: string) => Promise<{ token: string }>;
  verifyToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setPermissions(data.permissions);
    } catch {
      setUser(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string) {
    const { data } = await api.post('/auth/login', { email });
    return data;
  }

  async function verifyToken(token: string) {
    const { data } = await api.post('/auth/verify', { token });
    setSessionToken(data.sessionToken);
    setUser(data.user);
    setPermissions(data.permissions);
  }

  async function logout() {
    await api.post('/auth/logout');
    clearSessionToken();
    setUser(null);
    setPermissions(null);
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, verifyToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}