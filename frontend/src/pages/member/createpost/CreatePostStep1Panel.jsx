import { Link } from 'react-router-dom';
import Icon from '../../../components/Icons';
import { useToast } from '../../../context/ToastContext';

/**
 * CreatePostStep1Panel - Bước 1: chọn loại bài, danh mục, tiêu đề.
 */
export default function CreatePostStep1Panel({
  type,
  setType,
  categoryId,
  setCategoryId,
  title,
  setTitle,
  categories,
  onNext,
}) {
  const { toast } = useToast();

  const handleNext = () => {
    if (!title.trim()) {
      toast('Vui lòng nhập tiêu đề bài đăng', 'error');
      return;
    }
    onNext();
  };

  return (
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

      <div className="mt-8 flex items-center justify-between">
        <Link to="/home" className="px-2 text-sm font-semibold text-gray-400 hover:text-gray-600">
          Hủy
        </Link>
        <button onClick={handleNext} className="btn-primary px-6">
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
