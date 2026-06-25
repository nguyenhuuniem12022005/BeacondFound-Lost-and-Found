import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import Icon from '../../../components/Icons';
import { Spinner, TypeBadge } from '../../../components/common';
import { avatarOf } from '../../../utils/format';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';

export default function ChatPage({ conversationId, onSent, onOpened }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Mở phòng chat khi có conversationId
  useEffect(() => {
    if (!conversationId) {
      setChatRoom(null);
      setMessages([]);
      return;
    }
    setLoading(true);
    Promise.all([
      api.get(`/conversations/${conversationId}`),
      api.get(`/conversations/${conversationId}/messages`),
    ])
      .then(([convRes, msgRes]) => {
        setChatRoom(convRes.data.conversation);
        setMessages(msgRes.data.messages);
        onOpened?.(Number(conversationId));
      })
      .catch(() => navigate('/messages'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Socket realtime: nhận tin nhắn mới trong phòng đang mở
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('conversation:join', Number(conversationId));
    const onNew = (message) => {
      if (message.conversationId === Number(conversationId)) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    };
    socket.on('message:new', onNew);
    return () => {
      socket.emit('conversation:leave', Number(conversationId));
      socket.off('message:new', onNew);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, { content: inputContent });
      setMessages((prev) => (prev.some((m) => m.id === res.data.message.id) ? prev : [...prev, res.data.message]));
      setInputContent('');
      onSent?.();
    } catch {
      // giữ nội dung để gửi lại
    } finally {
      setSending(false);
    }
  };

  const displayMessages = () =>
    messages.map((m) => {
      const mine = m.senderId === user.id;
      return (
        <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
          {!mine && <img src={avatarOf(m.sender)} alt="" className="h-7 w-7 rounded-full object-cover" />}
          <div
            className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
              mine ? 'rounded-br-md bg-primary-700 text-white' : 'rounded-bl-md bg-white text-gray-800'
            }`}
          >
            <p className="whitespace-pre-line break-words">{m.content}</p>
            <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-primary-200' : 'text-gray-300'}`}>
              {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );
    });

  return (
    <div className={`${conversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-primary-50/30`}>
      {!conversationId ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-100 text-primary-400">
            {Icon.chat('h-10 w-10')}
          </div>
          <h2 className="mt-5 text-lg font-extrabold text-gray-800">
            Chọn một cuộc trò chuyện để bắt đầu nhắn tin
          </h2>
          <p className="mt-1 max-w-xs text-sm text-gray-400">
            Kết nối để xác minh và nhận lại món đồ thất lạc của bạn.
          </p>
        </div>
      ) : loading || !chatRoom ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Header chat */}
          <div className="flex items-center gap-3 border-b border-primary-100 bg-white px-4 py-3">
            <button onClick={() => navigate('/messages')} className="text-gray-400 hover:text-gray-600 md:hidden">
              {Icon.back('h-5 w-5')}
            </button>
            <img src={avatarOf(chatRoom.partner)} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="flex-1">
              <p className="font-bold text-gray-900">{chatRoom.partner?.fullName}</p>
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Đang hoạt động
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {/* Card bài đăng liên quan */}
            {chatRoom.post && (
              <div className="mx-auto max-w-sm rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  {chatRoom.post.images?.[0] && (
                    <img src={chatRoom.post.images[0].imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <TypeBadge type={chatRoom.post.type} />
                    <p className="truncate text-sm font-bold text-gray-800">{chatRoom.post.title}</p>
                    <Link to={`/posts/${chatRoom.post.id}`} className="text-xs font-semibold text-primary-700 hover:underline">
                      Xem bài chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {displayMessages()}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-primary-100 bg-white p-3">
            <input
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputContent.trim() || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800 disabled:opacity-40"
            >
              {Icon.send('h-4 w-4')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
