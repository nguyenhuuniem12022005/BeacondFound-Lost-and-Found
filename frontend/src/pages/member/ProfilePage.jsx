import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState, TypeBadge, StatusBadge, ConfirmModal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeAgo, avatarOf } from '../../utils/format';

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get('/posts/my')
      .then((res) => setPosts(res.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/posts/${deleteTarget.id}`);
      toast('Đã xóa bài đăng');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Xóa thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const filtered = filter ? posts.filter((p) => p.status === filter) : posts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
      {/* Header hồ sơ */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="h-24 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-400" />
        <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
          <img
            src={avatarOf(user)}
            alt=""
            className="-mt-10 h-24 w-24 rounded-full border-4 border-white object-cover shadow"
          />
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-gray-900">{user?.fullName}</h1>
            <p className="text-sm text-gray-500">
              <b>Email:</b> {user?.email}
              {user?.phone && (
                <>
                  {' '}• <b>SĐT:</b> {user.phone}
                </>
              )}{' '}
              • Tham gia {new Date(user?.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <Link to="/profile/edit" className="btn-secondary shrink-0">
            {Icon.edit('h-4 w-4')} Chỉnh sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* Bài đã đăng */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">Bài đang đăng</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filter === f.value
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Icon.document('h-10 w-10')}
          title="Chưa có bài đăng nào"
          description="Bạn chưa đăng bài nào trong mục này."
          action={
            <Link to="/create-post" className="btn-primary">
              {Icon.plus('h-4 w-4')} Đăng bài đầu tiên
            </Link>
          }
        />
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <div key={post.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
              <Link to={`/posts/${post.id}`} className="relative block h-40 bg-gray-100">
                {post.images?.[0] ? (
                  <img src={post.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">{Icon.camera('h-8 w-8')}</div>
                )}
                <div className="absolute left-2 top-2 flex gap-1.5">
                  <TypeBadge type={post.type} />
                </div>
                <div className="absolute right-2 top-2">
                  <StatusBadge status={post.status} />
                </div>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link to={`/posts/${post.id}`} className="line-clamp-1 font-bold text-gray-900 hover:text-primary-700">
                  {post.title}
                </Link>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  {Icon.pin('h-3.5 w-3.5')} {post.address}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  {Icon.clock('h-3.5 w-3.5')} {timeAgo(post.createdAt)}
                </p>
                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <Link to={`/posts/${post.id}/edit`} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-700">
                    {Icon.edit('h-3.5 w-3.5')} Sửa
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(post)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  >
                    {Icon.trash('h-3.5 w-3.5')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        loading={busy}
        title="Xóa bài đăng"
        message={`Bạn có chắc muốn xóa bài "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa bài"
      />
    </div>
  );
}
