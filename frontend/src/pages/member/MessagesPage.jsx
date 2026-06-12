import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { Spinner, EmptyState, TypeBadge } from '../../components/common';
import { timeAgo, avatarOf } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function MessagesPage() {
  const { id } = useParams(); // conversation id (optional)
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState('');

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = () => {
    api
      .get('/conversations')
      .then((res) => setConversations(res.data.conversations))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  };

  useEffect(loadConversations, []);

  // Mở phòng chat khi có :id
  useEffect(() => {
    if (!id) {
      setActiveConv(null);
      setMessages([]);
      return;
    }
    setLoadingChat(true);
    Promise.all([api.get(`/conversations/${id}`), api.get(`/conversations/${id}/messages`)])
      .then(([convRes, msgRes]) => {
        setActiveConv(convRes.data.conversation);
        setMessages(msgRes.data.messages);
        // reset unread của phòng này trong list
        setConversations((prev) =>
          prev.map((c) => (c.id === Number(id) ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => navigate('/messages'))
      .finally(() => setLoadingChat(false));
  }, [id]);

  // Socket realtime
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('conversation:join', Number(id));
    const onNew = (message) => {
      if (message.conversationId === Number(id)) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    };
    socket.on('message:new', onNew);
    return () => {
      socket.emit('conversation:leave', Number(id));
      socket.off('message:new', onNew);
    };
  }, [socket, id]);

  // Cập nhật list khi có tin nhắn mới ở phòng khác
  useEffect(() => {
    if (!socket) return;
    const onUpdated = () => loadConversations();
    socket.on('conversation:updated', onUpdated);
    return () => socket.off('conversation:updated', onUpdated);
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/conversations/${id}/messages`, { content });
      setMessages((prev) => (prev.some((m) => m.id === res.data.message.id) ? prev : [...prev, res.data.message]));
      setContent('');
      loadConversations();
    } catch {
      // giữ nội dung để gửi lại
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.partner?.fullName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Danh sách cuộc trò chuyện */}
      <div className={`${id ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-primary-100 bg-white md:w-80`}>
        <div className="border-b border-gray-100 p-4">
          <h1 className="text-lg font-extrabold text-gray-900">Đoạn chat</h1>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {Icon.search('h-4 w-4')}
            </span>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              className="w-full rounded-full bg-primary-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : filteredConvs.length === 0 ? (
            <EmptyState
              icon={Icon.chat('h-8 w-8')}
              title="Chưa có cuộc trò chuyện"
              description='Bấm "Nhắn tin" tại trang chi tiết bài đăng để bắt đầu trao đổi.'
            />
          ) : (
            filteredConvs.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`flex items-center gap-3 border-b border-gray-50 px-4 py-3 transition hover:bg-primary-50 ${
                  Number(id) === c.id ? 'bg-primary-50' : ''
                }`}
              >
                <img src={avatarOf(c.partner)} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`truncate text-sm ${c.unreadCount > 0 ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {c.partner?.fullName}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {c.lastMessage ? timeAgo(c.lastMessage.createdAt) : timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-xs ${c.unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                      {c.lastMessage
                        ? `${c.lastMessage.senderId === user.id ? 'Bạn: ' : ''}${c.lastMessage.content}`
                        : 'Bắt đầu trò chuyện'}
                    </p>
                    {c.unreadCount > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600" />}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chi tiết phòng chat */}
      <div className={`${id ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-primary-50/30`}>
        {!id ? (
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
        ) : loadingChat || !activeConv ? (
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
              <img src={avatarOf(activeConv.partner)} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{activeConv.partner?.fullName}</p>
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Đang hoạt động
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {/* Card bài đăng liên quan */}
              {activeConv.post && (
                <div className="mx-auto max-w-sm rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    {activeConv.post.images?.[0] && (
                      <img src={activeConv.post.images[0].imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <TypeBadge type={activeConv.post.type} />
                      <p className="truncate text-sm font-bold text-gray-800">{activeConv.post.title}</p>
                      <Link to={`/posts/${activeConv.post.id}`} className="text-xs font-semibold text-primary-700 hover:underline">
                        Xem bài chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m) => {
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
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="flex items-center gap-2 border-t border-primary-100 bg-white p-3">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!content.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white transition hover:bg-primary-800 disabled:opacity-40"
              >
                {Icon.send('h-4 w-4')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
