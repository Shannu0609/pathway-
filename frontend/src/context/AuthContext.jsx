import { createContext, useContext, useMemo, useState } from 'react';
import api, { getApiErrorMessage } from '../services/api.js';

const AuthContext = createContext(null);

const persistSession = (response) => {
  const { user: userData, token: tokenData } = response.data || {};
  if (!userData?.id || !userData?.role || typeof tokenData !== 'string' || !tokenData) {
    throw new Error('The server returned an invalid sign-in response.');
  }

  localStorage.setItem('placement-user', JSON.stringify(userData));
  localStorage.setItem('placement-token', tokenData);
  return { user: userData, token: tokenData };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('placement-user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('placement-token') || '');

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const { user: userData, token: tokenData } = persistSession(response);
    setUser(userData);
    setToken(tokenData);
    return userData;
  };

  const register = async (payload) => {
    const normalizedPayload = {
      ...payload,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase()
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedPayload.email)) {
      throw new Error('Enter a valid email address.');
    }
    if (normalizedPayload.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const response = await api.post('/auth/register', normalizedPayload);
    const { user: userData, token: tokenData } = persistSession(response);
    setUser(userData);
    setToken(tokenData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('placement-user');
    localStorage.removeItem('placement-token');
    setUser(null);
    setToken('');
  };

  const value = useMemo(() => ({ user, token, login, register, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
