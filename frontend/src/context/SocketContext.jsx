import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/axios';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, unreadNotifications: 0 });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setUnreadNotifications(0);
      return;
    }

    // Lấy số thông báo chưa đọc ban đầu
    api.get('/notifications').then((res) => setUnreadNotifications(res.data.unreadCount)).catch(() => {});

    const s = io(API_URL, { auth: { token: sessionStorage.getItem('token') } });
    socketRef.current = s;
    setSocket(s);

    s.on('notification:new', () => {
      setUnreadNotifications((n) => n + 1);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, unreadNotifications, setUnreadNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
