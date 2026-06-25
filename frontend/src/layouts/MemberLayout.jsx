import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Icon from '../components/Icons';
import { avatarOf } from '../utils/format';

const NAV_ITEMS = [
  { to: '/home', label: 'Trang chủ', icon: 'home' },
  { to: '/map', label: 'Bản đồ', icon: 'map' },
  { to: '/messages', label: 'Tin nhắn', icon: 'chat' },
  { to: '/notifications', label: 'Thông báo', icon: 'bell' },
  { to: '/profile', label: 'Hồ sơ', icon: 'user' },
];

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const { unreadNotifications } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/home?keyword=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Top navbar */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-4 border-b border-primary-100 bg-white px-4">
        <button
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Link to="/home" className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight text-primary-700">BeacondFound</span>
        </Link>
        <form onSubmit={onSearch} className="mx-auto hidden w-full max-w-md sm:block">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {Icon.search('h-4 w-4')}
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <Link to="/notifications" className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
            {Icon.bell('h-5 w-5')}
            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center">
              <img src={avatarOf(user)} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-100" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-2">
                    <p className="text-sm font-bold text-gray-800">{user?.fullName}</p>
                    <p className="truncate text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {Icon.user('h-4 w-4')} Hồ sơ cá nhân
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {Icon.shield('h-4 w-4')} Trang quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    {Icon.logout('h-4 w-4')} Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? 'absolute inset-y-14 left-0 z-20 block w-60 shadow-xl' : 'hidden'
          } shrink-0 border-r border-primary-100 bg-primary-50/60 md:static md:block md:w-56`}
        >
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'border-l-4 border-primary-600 bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-primary-100/60 hover:text-primary-700'
                  }`
                }
              >
                {Icon[item.icon]('h-5 w-5')}
                <span>{item.label}</span>
                {item.to === '/notifications' && unreadNotifications > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto">
          <Outlet />
          {/* Nút đăng bài nổi */}
          {location.pathname === '/home' && (
            <Link
              to="/create-post"
              className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-primary-800"
            >
              {Icon.plus('h-5 w-5')} Đăng bài
            </Link>
          )}
        </main>
      </div>
    </div>
  );
}
