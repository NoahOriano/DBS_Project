import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import jwtDecode from 'jwt-decode';

interface AuthContextValue {
  token: string | null;
  roles: string[];
  login: (token: string) => void;
  logout: () => void;
}

// shape of the decoded JWT payload (adjust fields if yours differ)
interface JwtTokenPayload {
  id?: number;
  username?: string;
  roles?: string[];
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  roles: [],
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token')
  );
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    // if no token, clear roles and bail
    if (!token) {
      setRoles([]);
      return;
    }

    try {
      // Now TS knows token is a string
      const payload = jwtDecode<JwtTokenPayload>(token);
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
    } catch (err) {
      console.error('JWT decode failed:', err);
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
