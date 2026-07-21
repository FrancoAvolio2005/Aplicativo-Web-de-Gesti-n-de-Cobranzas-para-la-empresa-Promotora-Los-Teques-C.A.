import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Durante pruebas: timeout muy largo (efectivamente desactivado)
// En producción cambiar a: 15 * 60 * 1000
const INACTIVITY_TIMEOUT = 999 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer       = useRef(null);

  // Al montar: restaurar sesión desde localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => logout(), INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (!user || user.rol !== 'cliente') return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const reset = () => startInactivityTimer();
    events.forEach(e => window.addEventListener(e, reset));
    startInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(inactivityTimer.current);
    };
  }, [user, startInactivityTimer]);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data; // contiene { user, redirectTo, accessToken, refreshToken }
  };

  const logout = async () => {
    clearTimeout(inactivityTimer.current);
    try { await api.delete('/api/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
