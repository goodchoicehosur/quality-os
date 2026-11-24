import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authApi from '../api/auth.api';
import { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('qos_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qos_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('qos_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('qos_token');
        localStorage.removeItem('qos_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('qos_token', res.token);
      localStorage.setItem('qos_user', JSON.stringify(res.data));
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('qos_token');
    localStorage.removeItem('qos_user');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
