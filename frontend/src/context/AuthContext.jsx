import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(!!sessionStorage.getItem('token'));

  useEffect(() => {
    // Xóa dữ liệu đăng nhập kiểu cũ dùng chung giữa các tab.
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const token = sessionStorage.getItem('token');
    if (!token) return;
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    sessionStorage.setItem('user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
