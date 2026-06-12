import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState, ConfirmModal } from '../../components/common';
import { formatDate, avatarOf } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lockTarget, setLockTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleLock = async () => {
    setBusy(true);
    try {
      await api.put(`/users/${lockTarget.id}/lock`);
      toast(lockTarget.status === 'LOCKED' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      setLockTarget(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Quản lý người dùng</h1>

      <div className="relative w-72">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {Icon.search('h-4 w-4')}
        </span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." className="input pl-9" />
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.users('h-10 w-10')} title="Không có người dùng" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Người dùng</th>
                  <th className="px-5 py-3">Vai trò</th>
                  <th className="px-5 py-3">Bài đăng</th>
                  <th className="px-5 py-3">Bị báo cáo</th>
                  <th className="px-5 py-3">Ngày tham gia</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <img src={avatarOf(u)} alt="" className="h-9 w-9 rounded-full object-cover" />
                        <span>
                          <span className="block font-bold text-gray-800">{u.fullName}</span>
                          <span className="block text-xs text-gray-400">{u.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.role === 'ADMIN' ? (
                        <span className="rounded-md bg-primary-700 px-2 py-0.5 text-xs font-bold text-white">ADMIN</span>
                      ) : (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">MEMBER</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u._count?.posts ?? 0}</td>
                    <td className="px-5 py-3 text-gray-600">{u._count?.reportsReceived ?? 0}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      {u.status === 'LOCKED' ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">Đã khóa</span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Hoạt động</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => setLockTarget(u)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                            u.status === 'LOCKED'
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : 'border-red-200 text-red-500 hover:bg-red-50'
                          }`}
                        >
                          {Icon.lock('h-3.5 w-3.5')} {u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={toggleLock}
        loading={busy}
        danger={lockTarget?.status !== 'LOCKED'}
        title={lockTarget?.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
        message={
          lockTarget?.status === 'LOCKED'
            ? `Mở khóa tài khoản "${lockTarget?.fullName}"? Người dùng sẽ đăng nhập lại được bình thường.`
            : `Khóa tài khoản "${lockTarget?.fullName}"? Người dùng sẽ không thể đăng nhập và các bài đang hoạt động sẽ bị gỡ.`
        }
        confirmText={lockTarget?.status === 'LOCKED' ? 'Mở khóa' : 'Xác nhận khóa'}
      />
    </div>
  );
}
