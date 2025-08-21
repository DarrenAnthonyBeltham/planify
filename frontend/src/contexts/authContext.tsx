import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { loginUser, getMe, type LoginCredentials, type User } from '../api';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (c: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('planify_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        localStorage.setItem('planify_token', token);
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('planify_token');
        }
      } else {
        localStorage.removeItem('planify_token');
        setUser(null);
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    const { token: newToken } = await loginUser(credentials);
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}