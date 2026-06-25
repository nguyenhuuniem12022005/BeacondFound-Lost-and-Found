import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState, TypeBadge, StatusBadge, ConfirmModal } from '../../components/common';
import { formatDateTime, avatarOf } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'ACTIVE', label: 'Đang hiển thị' },
];

export default function AdminPosts() {
  const { toast } = useToast();
  const [tab, setTab] = useState('PENDING');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/posts', { params: { status: tab } })
      .then((res) => setPosts(res.data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]);

  const approve = async (post) => {
    setBusy(true);
    try {
      await api.put(`/admin/posts/${post.id}/approve`);
      toast(`Đã duyệt bài "${post.title}"`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Duyệt thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/posts/${rejectTarget.id}/reject`);
      toast(`Đã từ chối và xóa vĩnh viễn bài "${rejectTarget.title}"`);
      setRejectTarget(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Từ chối thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.user?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Quản lý bài đăng</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold transition ${
                tab === t.value ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {Icon.search('h-4 w-4')}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tiêu đề, tác giả..."
            className="input w-64 pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.document('h-10 w-10')} title="Không có bài đăng" description="Không có bài đăng nào trong mục này." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Tiêu đề</th>
                  <th className="px-5 py-3">Phân loại</th>
                  <th className="px-5 py-3">Danh mục</th>
                  <th className="px-5 py-3">Tác giả</th>
                  <th className="px-5 py-3">Ngày tạo</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="max-w-[16rem] px-5 py-3">
                      <Link to={`/admin/posts/${p.id}`} className="line-clamp-1 font-bold text-primary-700 hover:underline">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <TypeBadge type={p.type} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">{p.category?.name || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="flex items-center gap-2">
                        <img src={avatarOf(p.user)} alt="" className="h-6 w-6 rounded-full object-cover" />
                        <span className="text-gray-700">{p.user?.fullName}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-400">{formatDateTime(p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          to={`/admin/posts/${p.id}`}
                          title="Xem chi tiết"
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-primary-300 hover:text-primary-700"
                        >
                          {Icon.eye('h-4 w-4')}
                        </Link>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => approve(p)}
                              disabled={busy}
                              title="Duyệt bài"
                              className="rounded-lg border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50"
                            >
                              {Icon.check('h-4 w-4')}
                            </button>
                            <button
                              onClick={() => setRejectTarget(p)}
                              disabled={busy}
                              title="Từ chối"
                              className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                            >
                              {Icon.x('h-4 w-4')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-gray-50 px-5 py-3 text-xs text-gray-400">
            Hiển thị {filtered.length} kết quả
          </p>
        </div>
      )}

      <ConfirmModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={reject}
        loading={busy}
        title="Từ chối bài đăng"
        message={`Từ chối bài "${rejectTarget?.title}"? Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống và thành viên sẽ nhận được thông báo.`}
        confirmText="Từ chối"
      />
    </div>
  );
}
