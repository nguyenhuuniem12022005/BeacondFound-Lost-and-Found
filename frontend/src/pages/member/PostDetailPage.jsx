import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, TypeBadge, StatusBadge, EmptyState } from '../../components/common';
import ReportModal from '../../components/ReportModal';
import { pinForType } from '../../components/leafletIcons';
import { timeAgo, formatDateTime, avatarOf } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [creatingConv, setCreatingConv] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts/${id}`)
      .then((res) => {
        setPost(res.data.post);
        setActiveImage(0);
      })
      .catch((err) => setError(err.response?.data?.message || 'Không tải được bài đăng'))
      .finally(() => setLoading(false));
  }, [id]);

  const startChat = async () => {
    setCreatingConv(true);
    try {
      const res = await api.post('/conversations', { postId: post.id });
      navigate(`/messages/${res.data.conversation.id}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Không thể tạo cuộc trò chuyện', 'error');
    } finally {
      setCreatingConv(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error || !post)
    return (
      <EmptyState
        icon={Icon.info('h-10 w-10')}
        title="Không tìm thấy bài đăng"
        description={error}
        action={
          <Link to="/home" className="btn-primary">
            Về trang chủ
          </Link>
        }
      />
    );

  const isOwner = user?.id === post.user?.id;
  const images = post.images || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700">
        {Icon.back('h-4 w-4')} Quay lại
      </button>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cột trái: ảnh + nội dung */}
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <div className="h-80 bg-gray-100 sm:h-96">
              {images[activeImage] ? (
                <img src={images[activeImage].imageUrl} alt={post.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">{Icon.camera('h-14 w-14')}</div>
              )}
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 p-3">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-20 overflow-hidden rounded-lg border-2 ${
                      i === activeImage ? 'border-primary-600' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                {Array.from({ length: Math.max(0, 3 - images.length) }).map((_, i) => (
                  <div key={i} className="flex h-16 w-20 items-center justify-center rounded-lg bg-primary-50 text-primary-200">
                    {Icon.camera('h-5 w-5')}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nội dung */}
          <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={post.type} />
              <StatusBadge status={post.status} />
              {post.category && (
                <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {post.category.name}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-gray-900">{post.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">{Icon.clock('h-4 w-4 text-primary-500')} {timeAgo(post.createdAt)}</span>
              <span className="flex items-center gap-1">{Icon.pin('h-4 w-4 text-primary-500')} {post.address}</span>
            </div>

            <h2 className="mt-6 border-b border-gray-100 pb-2 font-bold text-gray-900">Mô tả</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{post.description}</p>
            <p className="mt-3 text-sm text-gray-500">
              <b>Thời điểm xảy ra:</b> {formatDateTime(post.eventDate)}
            </p>

            {/* Tags AI */}
            {post.tags?.length > 0 && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-primary-700">
                  {Icon.sparkles('h-4 w-4')} Tags từ AI
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span key={t.id} className="rounded-full border border-primary-200 bg-white px-3 py-1 text-xs font-semibold text-primary-700">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vị trí */}
            <h2 className="mt-6 border-b border-gray-100 pb-2 font-bold text-gray-900">Vị trí</h2>
            <div className="mt-3 h-64 overflow-hidden rounded-xl">
              <MapContainer center={[post.latitude, post.longitude]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[post.latitude, post.longitude]} icon={pinForType(post.type)} />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Cột phải: người đăng */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-card">
            <img src={avatarOf(post.user)} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-primary-100" />
            <h3 className="mt-3 font-bold text-gray-900">{post.user?.fullName}</h3>
            <p className="text-xs text-gray-400">
              Tham gia {new Date(post.user?.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
            </p>
            {!isOwner ? (
              <>
                <button onClick={startChat} disabled={creatingConv} className="btn-primary mt-4 w-full py-2.5">
                  {Icon.chat('h-4 w-4')} {creatingConv ? 'Đang mở...' : 'Nhắn tin cho chủ bài'}
                </button>
                <button
                  onClick={() => setReportOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-600"
                >
                  {Icon.flag('h-3.5 w-3.5')} Báo cáo bài viết
                </button>
              </>
            ) : (
              <Link to={`/posts/${post.id}/edit`} className="btn-secondary mt-4 w-full">
                {Icon.edit('h-4 w-4')} Chỉnh sửa bài đăng
              </Link>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        open={!!reportOpen}
        onClose={() => setReportOpen(false)}
        postId={post.id}
        targetName={`bài viết "${post.title}"`}
      />
    </div>
  );
}
