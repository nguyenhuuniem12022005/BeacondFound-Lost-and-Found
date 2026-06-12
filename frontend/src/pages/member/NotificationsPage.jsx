import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState } from '../../components/common';
import { timeAgo, NOTIFICATION_META } from '../../utils/format';
import { useSocket } from '../../context/SocketContext';

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'post', label: 'Bài đăng' },
  { value: 'message', label: 'Tin nhắn' },
];

function iconFor(type) {
  const meta = NOTIFICATION_META[type] || NOTIFICATION_META.SYSTEM;
  const icons = {
    check: Icon.check('h-5 w-5'),
    x: Icon.x('h-5 w-5'),
    chat: Icon.chat('h-5 w-5'),
    shield: Icon.shield('h-5 w-5'),
    info: Icon.info('h-5 w-5'),
  };
  return { node: icons[meta.icon], color: meta.color };
}

function groupLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  if (d >= today) return 'HÔM NAY';
  if (d >= yesterday) return 'HÔM QUA';
  return 'TRƯỚC ĐÓ';
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { setUnreadNotifications } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');

  const load = () => {
    api
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const open = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadNotifications((c) => Math.max(0, c - 1));
      } catch {
        // bỏ qua
      }
    }
    if (n.targetUrl) navigate(n.targetUrl);
  };

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadNotifications(0);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = notifications.filter((n) => {
    if (tab === 'unread') return !n.isRead;
    if (tab === 'post') return n.type.startsWith('POST');
    if (tab === 'message') return n.type === 'NEW_MESSAGE';
    return true;
  });

  // Gom nhóm theo ngày
  const groups = [];
  for (const n of filtered) {
    const label = groupLabel(n.createdAt);
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(n);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
          <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline">
            {Icon.check('h-3.5 w-3.5')} Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              tab === t.value ? 'bg-primary-700 text-white' : 'border border-gray-200 bg-white text-gray-500 hover:border-primary-300'
            }`}
          >
            {t.label}
            {t.value === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Icon.bell('h-10 w-10')}
          title="Không có thông báo"
          description="Bạn sẽ nhận được thông báo khi bài đăng được duyệt hoặc có tin nhắn mới."
        />
      ) : (
        <div className="mt-5 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="rounded-lg bg-primary-100/70 px-3 py-1.5 text-xs font-bold tracking-wide text-primary-800">
                {g.label}
              </p>
              <div className="mt-2 space-y-1">
                {g.items.map((n) => {
                  const ic = iconFor(n.type);
                  return (
                    <button
                      key={n.id}
                      onClick={() => open(n)}
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-primary-50 ${
                        !n.isRead ? 'bg-primary-50/70' : 'bg-white'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ic.color}`}>
                        {ic.node}
                      </span>
                      <span className="flex-1">
                        <span className={`block text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {n.content}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
