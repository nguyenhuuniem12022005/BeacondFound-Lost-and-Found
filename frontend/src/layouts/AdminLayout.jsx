import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';
import { avatarOf } from '../utils/format';

const NAV_ITEMS = [
  { to: '/admin', label: 'Thống kê', icon: 'chart', end: true },
  { to: '/admin/posts', label: 'Bài đăng', icon: 'document' },
  { to: '/admin/categories', label: 'Danh mục', icon: 'folder' },
  { to: '/admin/reports', label: 'Báo cáo', icon: 'shield' },
  { to: '/admin/users', label: 'Người dùng', icon: 'users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* Sidebar tối theo thiết kế admin */}
      <aside className="flex w-56 shrink-0 flex-col bg-neutral-900 text-neutral-300">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-800 px-4">
          <span className="font-extrabold tracking-tight text-white">BeacondFound</span>
          <span className="rounded bg-primary-700 px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
        </div>
        <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Menu quản trị
        </p>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'border-l-4 border-primary-500 bg-primary-900/60 text-white'
                    : 'hover:bg-neutral-800 hover:text-white'
                }`
              }
            >
              {Icon[item.icon]('h-5 w-5')}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-neutral-800"
          >
            {Icon.logout('h-4 w-4')} Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-white px-6">
          <span className="text-sm font-semibold text-gray-700">{user?.fullName}</span>
          <img src={avatarOf(user)} alt="" className="h-8 w-8 rounded-full object-cover" />
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
