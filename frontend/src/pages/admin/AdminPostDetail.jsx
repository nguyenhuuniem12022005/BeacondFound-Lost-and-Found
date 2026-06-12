import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, TypeBadge, StatusBadge, ConfirmModal } from '../../components/common';
import { pinForType } from '../../components/leafletIcons';
import { formatDateTime, avatarOf } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AdminPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'approve' | 'reject' | 'delete'

  useEffect(() => {
    api
      .get(`/posts/${id}`)
      .then((res) => setPost(res.data.post))
      .catch(() => navigate('/admin/posts'))
      .finally(() => setLoading(false));
  }, [id]);

  const act = async () => {
    setBusy(true);
    try {
      if (confirm === 'approve') {
        await api.put(`/admin/posts/${id}/approve`);
        toast('Đã duyệt bài đăng và gửi thông báo cho người đăng');
      } else if (confirm === 'reject') {
        await api.put(`/admin/posts/${id}/reject`);
        toast('Đã từ chối bài đăng và gửi thông báo cho người đăng');
      } else if (confirm === 'delete') {
        await api.delete(`/posts/${id}`);
        toast('Đã xóa bài đăng vi phạm');
      }
      navigate('/admin/posts');
    } catch (err) {
      toast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!post) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700">
          {Icon.back('h-4 w-4')} Quay lại danh sách
        </button>
        <div className="flex gap-2">
          {post.status === 'PENDING' && (
            <>
              <button onClick={() => setConfirm('approve')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {Icon.check('h-4 w-4')} Duyệt bài
              </button>
              <button onClick={() => setConfirm('reject')} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                {Icon.x('h-4 w-4')} Từ chối
              </button>
            </>
          )}
          {post.status !== 'DELETED' && (
            <button onClick={() => setConfirm('delete')} className="btn-secondary text-red-600">
              {Icon.trash('h-4 w-4')} Xóa bài
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={post.type} />
              <StatusBadge status={post.status} />
              {post.category && (
                <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {post.category.name}
                </span>
              )}
              <span className="ml-auto text-xs text-gray-400">POST #{post.id}</span>
            </div>
            <h1 className="mt-3 text-xl font-extrabold text-gray-900">{post.title}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{post.description}</p>
            <div className="mt-4 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
              <p><b>Thời điểm xảy ra:</b> {formatDateTime(post.eventDate)}</p>
              <p><b>Ngày tạo:</b> {formatDateTime(post.createdAt)}</p>
              <p className="sm:col-span-2"><b>Địa chỉ:</b> {post.address}</p>
            </div>
            {post.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span key={t.id} className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ảnh minh chứng */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <h2 className="font-bold text-gray-900">Ảnh minh chứng ({post.images?.length || 0})</h2>
            {post.images?.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {post.images.map((img) => (
                  <a key={img.id} href={img.imageUrl} target="_blank" rel="noreferrer" className="block h-36 overflow-hidden rounded-xl border border-gray-100">
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">Bài đăng không có ảnh.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="font-bold text-gray-900">Người đăng</h2>
            <div className="mt-3 flex items-center gap-3">
              <img src={avatarOf(post.user)} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-800">{post.user?.fullName}</p>
                <p className="text-xs text-gray-400">{post.user?.email}</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <h2 className="px-5 pt-4 font-bold text-gray-900">Vị trí ghim</h2>
            <p className="px-5 pb-2 text-xs text-gray-400">
              {post.latitude.toFixed(5)}, {post.longitude.toFixed(5)}
            </p>
            <div className="h-56">
              <MapContainer center={[post.latitude, post.longitude]} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[post.latitude, post.longitude]} icon={pinForType(post.type)} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        loading={busy}
        danger={confirm !== 'approve'}
        title={confirm === 'approve' ? 'Duyệt bài đăng' : confirm === 'reject' ? 'Từ chối bài đăng' : 'Xóa bài đăng'}
        message={
          confirm === 'approve'
            ? 'Bài đăng sẽ chuyển sang trạng thái Hoạt động, hiển thị công khai và người đăng sẽ nhận được thông báo.'
            : confirm === 'reject'
            ? 'Bài đăng sẽ bị từ chối và người đăng sẽ nhận được thông báo.'
            : 'Bài đăng sẽ bị xóa khỏi hệ thống và người đăng sẽ nhận được thông báo.'
        }
        confirmText={confirm === 'approve' ? 'Duyệt' : confirm === 'reject' ? 'Từ chối' : 'Xóa'}
      />
    </div>
  );
}
