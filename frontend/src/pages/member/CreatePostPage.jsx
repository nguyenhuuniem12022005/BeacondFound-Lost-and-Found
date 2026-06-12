import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import { redPin } from '../../components/leafletIcons';

const STEPS = [
  { num: 1, label: 'Loại tin' },
  { num: 2, label: 'Mô tả' },
  { num: 3, label: 'Vị trí' },
  { num: 4, label: 'Hình ảnh & Tag' },
];

const DEFAULT_CENTER = [10.7769, 106.7009];

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

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [type, setType] = useState('LOST');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  // Step 2
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  // Step 3
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [geocoding, setGeocoding] = useState(false);
  // Step 4
  const [files, setFiles] = useState([]); // {file, preview}
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const validateStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        toast('Vui lòng nhập tiêu đề bài đăng', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (!description.trim()) {
        toast('Vui lòng nhập mô tả chi tiết', 'error');
        return false;
      }
      if (!eventDate) {
        toast('Vui lòng chọn thời điểm xảy ra', 'error');
        return false;
      }
    }
    if (step === 3) {
      if (!address.trim()) {
        toast('Vui lòng nhập địa chỉ', 'error');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(4, s + 1));
  };

  const geocodeAddress = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
      );
      const data = await res.json();
      if (data[0]) setPosition([Number(data[0].lat), Number(data[0].lon)]);
      else toast('Không tìm thấy địa chỉ, hãy ghim trực tiếp trên bản đồ', 'info');
    } catch {
      toast('Không thể định vị địa chỉ, hãy ghim trực tiếp trên bản đồ', 'info');
    } finally {
      setGeocoding(false);
    }
  };

  const onPickFiles = async (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 3 - files.length);
    if (picked.length === 0) return;
    const withPreview = picked.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    const all = [...files, ...withPreview];
    setFiles(all);
    e.target.value = '';

    // Gọi AI Vision gợi ý tag
    setAnalyzing(true);
    try {
      const fd = new FormData();
      all.forEach((f) => fd.append('images', f.file));
      const res = await api.post('/ai/suggest-tags', fd);
      setTags((prev) => Array.from(new Set([...prev, ...res.data.tags])));
    } catch {
      // mock vẫn luôn trả về, lỗi thì bỏ qua
    } finally {
      setAnalyzing(false);
    }
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    const t = newTag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag('');
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      // 1. Upload ảnh
      let imageUrls = [];
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('images', f.file));
        const up = await api.post('/upload/images', fd);
        imageUrls = up.data.urls;
      }
      // 2. Tạo bài đăng (trạng thái PENDING)
      await api.post('/posts', {
        title: title.trim(),
        type,
        description: description.trim(),
        eventDate: new Date(eventDate).toISOString(),
        address: address.trim(),
        latitude: position[0],
        longitude: position[1],
        categoryId: categoryId || null,
        images: imageUrls,
        tags,
      });
      toast('Đăng bài thành công! Bài viết sẽ hiển thị sau khi Admin duyệt.');
      navigate('/profile');
    } catch (err) {
      toast(err.response?.data?.message || 'Đăng bài thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-primary-100 bg-white px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold text-primary-700">
          {Icon.back('h-5 w-5')} <span>BeacondFound</span>
        </button>
        <Link to="/home" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          {Icon.x('h-5 w-5')}
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-8">
          {/* Stepper */}
          <div className="mb-8 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      step > s.num
                        ? 'bg-primary-700 text-white'
                        : step === s.num
                        ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                        : 'bg-primary-100 text-primary-300'
                    }`}
                  >
                    {step > s.num ? Icon.check('h-4 w-4') : s.num}
                  </div>
                  <span
                    className={`mt-1.5 hidden text-[11px] font-semibold sm:block ${
                      step >= s.num ? 'text-primary-700' : 'text-gray-300'
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 mb-5 h-0.5 flex-1 rounded ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h1 className="text-center text-xl font-extrabold text-gray-900">Bạn muốn đăng loại tin gì?</h1>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setType('LOST')}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition ${
                    type === 'LOST' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${type === 'LOST' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
                    {Icon.search('h-6 w-6')}
                  </span>
                  <span className={`font-bold ${type === 'LOST' ? 'text-primary-700' : 'text-gray-600'}`}>Báo mất đồ</span>
                </button>
                <button
                  onClick={() => setType('FOUND')}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition ${
                    type === 'FOUND' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <span className={`flex h-14 w-14 items-center justify-center rounded-full ${type === 'FOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712l.003-2.024a.668.668 0 01.198-.471 1.575 1.575 0 10-2.228-2.228 3.818 3.818 0 00-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0116.35 15m.002 0h-.002" />
                    </svg>
                  </span>
                  <span className={`font-bold ${type === 'FOUND' ? 'text-emerald-700' : 'text-gray-600'}`}>Nhặt được đồ</span>
                </button>
              </div>
              <div className="mt-6">
                <label className="label">Danh mục (tùy chọn)</label>
                <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Chọn danh mục...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label className="label">Tiêu đề bài đăng *</label>
                <input
                  className="input"
                  placeholder="VD: Rơi ví da đen tại sảnh A tòa nhà X"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="mt-1 text-right text-xs text-gray-400">{title.length}/100</p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Mô tả chi tiết món đồ</h1>
              <p className="mt-1 text-sm text-gray-500">
                Cung cấp thông tin chi tiết giúp mọi người dễ dàng nhận ra món đồ của bạn.
              </p>
              <div className="mt-5">
                <label className="label">Mô tả chi tiết *</label>
                <textarea
                  rows={6}
                  maxLength={2000}
                  className="input resize-none"
                  placeholder="Mô tả màu sắc, đặc điểm nhận dạng, hoàn cảnh, dấu hiệu riêng..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="mt-1 text-right text-xs text-gray-400">{description.length}/2000</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Màu sắc', 'Kích thước', 'Đặc điểm riêng'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDescription((d) => (d ? `${d}\n${chip}: ` : `${chip}: `))}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-700"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <label className="label">Thời điểm xảy ra (Ước lượng) *</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={eventDate}
                  max={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Ghim vị trí trên bản đồ</h1>
              <div className="mt-4">
                <label className="label">Địa chỉ *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {Icon.search('h-4 w-4')}
                    </span>
                    <input
                      className="input pl-9"
                      placeholder="Nhập địa chỉ..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
                    />
                  </div>
                  <button type="button" onClick={geocodeAddress} className="btn-secondary shrink-0" disabled={geocoding}>
                    {geocoding ? '...' : 'Định vị'}
                  </button>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <div className="h-72">
                  <MapContainer center={position} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FlyTo center={position} />
                    <LocationPicker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                <div className="flex items-center justify-between bg-primary-50 px-3 py-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1 font-semibold text-primary-700">
                    {Icon.pin('h-3.5 w-3.5')} {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </span>
                  <span>Click lên bản đồ để ghim chính xác vị trí</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h1 className="text-center text-xl font-extrabold text-gray-900">Tải ảnh & xác nhận</h1>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
              <button
                type="button"
                onClick={() => files.length < 3 && fileInputRef.current?.click()}
                className="mt-6 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/50 py-10 text-primary-600 transition hover:bg-primary-50"
              >
                {Icon.upload('h-8 w-8')}
                <span className="text-sm font-semibold">Kéo thả tối đa 3 ảnh hoặc bấm để chọn</span>
                <span className="text-xs text-primary-400">{files.length}/3 ảnh</span>
              </button>

              {/* Preview */}
              <div className="mt-4 flex gap-3">
                {files.map((f, i) => (
                  <div key={i} className="relative h-20 w-24 overflow-hidden rounded-lg border border-gray-200">
                    <img src={f.preview} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      {Icon.x('h-3 w-3')}
                    </button>
                  </div>
                ))}
                {Array.from({ length: 3 - files.length }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-24 items-center justify-center rounded-lg bg-primary-50 text-primary-200"
                  >
                    {Icon.camera('h-6 w-6')}
                  </button>
                ))}
              </div>

              {/* AI tags */}
              <div className="mt-6">
                <p className="flex items-center gap-1.5 text-sm font-bold text-primary-700">
                  {Icon.sparkles('h-4 w-4')}
                  {analyzing ? 'AI Vision đang phân tích ảnh...' : 'AI Vision đã phân tích — Gợi ý thẻ (Tags)'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
                    >
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-primary-400 hover:text-primary-700">
                        ✕
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="+ Thêm tag"
                      className="w-24 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs outline-none focus:border-primary-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                {Icon.info('h-4 w-4 shrink-0')}
                <span>
                  Bài viết sẽ ở trạng thái <b>"Chờ duyệt"</b> cho đến khi quản trị viên kiểm tra và phê
                  duyệt (~1 giờ).
                </span>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="btn-secondary">
                ← Quay lại
              </button>
            ) : (
              <Link to="/home" className="px-2 text-sm font-semibold text-gray-400 hover:text-gray-600">
                Hủy
              </Link>
            )}
            {step < 4 ? (
              <button onClick={next} className="btn-primary px-6">
                Tiếp theo →
              </button>
            ) : (
              <button onClick={submit} className="btn-primary px-6" disabled={submitting || analyzing}>
                {submitting ? 'Đang đăng...' : 'Đăng bài ⤴'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
