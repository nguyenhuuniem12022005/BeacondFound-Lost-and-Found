import { useToast } from '../../../context/ToastContext';

/**
 * CreatePostStep2Panel - Bước 2: mô tả chi tiết và thời điểm xảy ra.
 */
export default function CreatePostStep2Panel({
  description,
  setDescription,
  eventDate,
  setEventDate,
  onNext,
  onBack,
}) {
  const { toast } = useToast();

  const handleNext = () => {
    if (!description.trim()) {
      toast('Vui lòng nhập mô tả chi tiết', 'error');
      return;
    }
    if (!eventDate) {
      toast('Vui lòng chọn thời điểm xảy ra', 'error');
      return;
    }
    onNext();
  };

  const handleBack = () => onBack();

  return (
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

      <div className="mt-8 flex items-center justify-between">
        <button onClick={handleBack} className="btn-secondary">
          ← Quay lại
        </button>
        <button onClick={handleNext} className="btn-primary px-6">
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
