import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import ChatListPage from './messages/ChatListPage';
import ChatPage from './messages/ChatPage';

/**
 * Khung 2 cột ghép ChatListPage (trái) và ChatPage (phải).
 * Giữ danh sách phòng chat tại đây để 2 trang dùng chung dữ liệu.
 */
export default function MessagesPage() {
  const { id } = useParams();
  const { socket } = useSocket();

  const [chatRooms, setChatRooms] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadChatRooms = () => {
    api
      .get('/conversations')
      .then((res) => setChatRooms(res.data.conversations))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  };

  useEffect(loadChatRooms, []);

  // Cập nhật danh sách khi có tin nhắn mới ở phòng khác
  useEffect(() => {
    if (!socket) return;
    const onUpdated = () => loadChatRooms();
    socket.on('conversation:updated', onUpdated);
    return () => socket.off('conversation:updated', onUpdated);
  }, [socket]);

  const handleChatRoomOpened = (chatRoomId) => {
    setChatRooms((prev) => prev.map((c) => (c.id === chatRoomId ? { ...c, unreadCount: 0 } : c)));
  };

  return (
    <div className="flex h-full">
      <ChatListPage chatRooms={chatRooms} loading={loadingList} activeId={id} />
      <ChatPage
        key={id}
        conversationId={id}
        onSent={loadChatRooms}
        onOpened={handleChatRoomOpened}
      />
    </div>
  );
}
