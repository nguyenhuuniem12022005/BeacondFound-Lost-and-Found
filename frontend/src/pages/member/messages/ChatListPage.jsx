import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/Icons';
import { Spinner, EmptyState } from '../../../components/common';
import { timeAgo, avatarOf } from '../../../utils/format';
import { useAuth } from '../../../context/AuthContext';

export default function ChatListPage({ chatRooms, loading, activeId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (e) => setSearchKeyword(e.target.value);

  const handleSelectChatRoom = (c) => navigate(`/messages/${c.id}`);

  const filteredChatRooms = chatRooms.filter((c) =>
    c.partner?.fullName?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div
      className={`${activeId ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-primary-100 bg-white md:w-80`}
    >
      <div className="border-b border-gray-100 p-4">
        <h1 className="text-lg font-extrabold text-gray-900">Đoạn chat</h1>
        <div className="relative mt-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {Icon.search('h-4 w-4')}
          </span>
          <input
            value={searchKeyword}
            onChange={handleSearch}
            placeholder="Tìm cuộc trò chuyện"
            className="w-full rounded-full bg-primary-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filteredChatRooms.length === 0 ? (
          <EmptyState
            icon={Icon.chat('h-8 w-8')}
            title="Chưa có cuộc trò chuyện"
            description='Bấm "Nhắn tin" tại trang chi tiết bài đăng để bắt đầu trao đổi.'
          />
        ) : (
          filteredChatRooms.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelectChatRoom(c)}
              className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-primary-50 ${
                Number(activeId) === c.id ? 'bg-primary-50' : ''
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
            </button>
          ))
        )}
      </div>
    </div>
  );
}
