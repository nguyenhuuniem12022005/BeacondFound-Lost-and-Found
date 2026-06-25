import { useRef, useState } from 'react';
import api from '../../../api/axios';
import Icon from '../../../components/Icons';

/**
 * CreatePostStep4Panel - Bước 4: tải ảnh, nhận gợi ý Tag từ AI, xác nhận đăng.
 */
export default function CreatePostStep4Panel({
  files,
  setFiles,
  tags,
  setTags,
  submitting,
  onBack,
  onSubmit,
}) {
  const fileInputRef = useRef(null);
  const [newTag, setNewTag] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadImages = async (e) => {
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

  const handleRemoveTag = (t) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleSubmit = () => onSubmit();

  return (
    <div>
      <h1 className="text-center text-xl font-extrabold text-gray-900">Tải ảnh & xác nhận</h1>
      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUploadImages} />
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
              <button onClick={() => handleRemoveTag(t)} className="text-primary-400 hover:text-primary-700">
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

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Quay lại
        </button>
        <button onClick={handleSubmit} className="btn-primary px-6" disabled={submitting || analyzing}>
          {submitting ? 'Đang đăng...' : 'Đăng bài ⤴'}
        </button>
      </div>
    </div>
  );
}
