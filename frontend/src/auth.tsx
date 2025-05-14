import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';

interface JwtTokenPayload {
  id?: number;
  username?: string;
  roles?: string[];
}

interface AuthContextValue {
  token: string | null;
  roles: string[];
  user: JwtTokenPayload | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  roles: [],
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [roles, setRoles] = useState<string[]>([]);
  const [user, setUser] = useState<JwtTokenPayload | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setRoles([]);
      return;
    }

    try {
      const payload = jwtDecode<JwtTokenPayload>(token);
      setUser(payload);
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
    } catch (err) {
      console.error('JWT decode failed:', err);
      setUser(null);
      setRoles([]);
    }
  }, [token]);

  const login = (tok: string) => {
    localStorage.setItem('token', tok);
    setToken(tok);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, roles, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
