import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextValue {
  token: string | null;
  roles: string[];
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      const payload: any = jwtDecode(token);
      setRoles(payload.roles || []);
    } else {
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
    <AuthContext.Provider value={{ token, roles, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);