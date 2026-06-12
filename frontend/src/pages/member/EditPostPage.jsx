import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen } from '../../components/common';
import { redPin } from '../../components/leafletIcons';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={redPin} /> : null;
}

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15);
  }, [center?.[0], center?.[1]]);
  return null;
}

export default function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [post, setPost] = useState(null);

  const [form, setForm] = useState(null);
  const [position, setPosition] = useState(null);
  const [existingImages, setExistingImages] = useState([]); // url strings
  const [newFiles, setNewFiles] = useState([]); // {file, preview}
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/posts/${id}`), api.get('/categories')])
      .then(([postRes, catRes]) => {
        const p = postRes.data.post;
        if (p.user.id !== user.id && user.role !== 'ADMIN') {
          toast('Bạn không có quyền sửa bài đăng này', 'error');
          navigate('/profile');
          return;
        }
        setPost(p);
        setForm({
          title: p.title,
          type: p.type,
          description: p.description,
          eventDate: new Date(p.eventDate).toISOString().slice(0, 16),
          address: p.address,
          categoryId: p.categoryId || '',
        });
        setPosition([p.latitude, p.longitude]);
        setExistingImages(p.images.map((i) => i.imageUrl));
        setTags(p.tags.map((t) => t.name));
        setCategories(catRes.data.categories);
      })
      .catch(() => {
        toast('Không tải được bài đăng', 'error');
        navigate('/profile');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onPickFiles = (e) => {
    const max = 3 - existingImages.length - newFiles.length;
    const picked = Array.from(e.target.files || []).slice(0, max);
    setNewFiles((prev) => [...prev, ...picked.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    e.target.value = '';
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.address.trim()) {
      toast('Vui lòng nhập đầy đủ tiêu đề, mô tả và địa chỉ', 'error');
      return;
    }
    setSaving(true);
    try {
      let urls = [...existingImages];
      if (newFiles.length > 0) {
        const fd = new FormData();
        newFiles.forEach((f) => fd.append('images', f.file));
        const up = await api.post('/upload/images', fd);
        urls = [...urls, ...up.data.urls];
      }
      await api.put(`/posts/${id}`, {
        ...form,
        categoryId: form.categoryId || null,
        eventDate: new Date(form.eventDate).toISOString(),
        latitude: position[0],
        longitude: position[1],
        images: urls.slice(0, 3),
        tags,
      });
      toast(
        post.status === 'ACTIVE'
          ? 'Đã lưu! Bài đăng chuyển về trạng thái Chờ duyệt để Admin duyệt lại.'
          : 'Đã lưu thay đổi!'
      );
      navigate('/profile');
    } catch (err) {
      toast(err.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <LoadingScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-700">
        {Icon.back('h-4 w-4')} Quay lại
      </button>
      <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card">
        <h1 className="text-xl font-extrabold text-gray-900">Chỉnh sửa bài đăng</h1>
        {post.status === 'ACTIVE' && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Lưu ý: Bài đang hoạt động, sau khi sửa sẽ chuyển về <b>Chờ duyệt</b> để Admin duyệt lại.
          </p>
        )}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setForm({ ...form, type: 'LOST' })}
              className={`rounded-xl border-2 py-2.5 text-sm font-bold ${
                form.type === 'LOST' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              Báo mất đồ
            </button>
            <button
              onClick={() => setForm({ ...form, type: 'FOUND' })}
              className={`rounded-xl border-2 py-2.5 text-sm font-bold ${
                form.type === 'FOUND' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              Nhặt được đồ
            </button>
          </div>
          <div>
            <label className="label">Tiêu đề *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Danh mục</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Không chọn</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mô tả *</label>
            <textarea
              rows={5}
              className="input resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Thời điểm xảy ra *</label>
            <input
              type="datetime-local"
              className="input"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Địa chỉ *</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="h-56 overflow-hidden rounded-xl border border-gray-200">
            <MapContainer center={position} zoom={14} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FlyTo center={position} />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          {/* Ảnh */}
          <div>
            <label className="label">Hình ảnh (tối đa 3)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
            <div className="flex gap-3">
              {existingImages.map((url, i) => (
                <div key={url} className="relative h-20 w-24 overflow-hidden rounded-lg border border-gray-200">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setExistingImages(existingImages.filter((_, x) => x !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div key={f.preview} className="relative h-20 w-24 overflow-hidden rounded-lg border border-gray-200">
                  <img src={f.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setNewFiles(newFiles.filter((_, x) => x !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {existingImages.length + newFiles.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-24 items-center justify-center rounded-lg border-2 border-dashed border-primary-200 bg-primary-50 text-primary-400 hover:border-primary-400"
                >
                  {Icon.plus('h-6 w-6')}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-primary-400 hover:text-primary-700">
                    ✕
                  </button>
                </span>
              ))}
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const t = newTag.trim().toLowerCase();
                    if (t && !tags.includes(t)) setTags([...tags, t]);
                    setNewTag('');
                  }
                }}
                placeholder="+ Thêm tag"
                className="w-24 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs outline-none focus:border-primary-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            Hủy
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
