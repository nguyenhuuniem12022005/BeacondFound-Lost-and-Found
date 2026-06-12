import { POST_STATUS } from '../utils/format';

export function Spinner({ className = 'h-8 w-8' }) {
  return (
    <svg className={`animate-spin text-primary-600 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingScreen({ text = 'Đang tải...' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
      <Spinner />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 text-primary-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}

export function TypeBadge({ type, className = '' }) {
  return type === 'LOST' ? (
    <span className={`inline-flex items-center rounded-md bg-primary-600 px-2 py-0.5 text-xs font-bold text-white ${className}`}>
      Mất đồ
    </span>
  ) : (
    <span className={`inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white ${className}`}>
      Nhặt được
    </span>
  );
}

export function StatusBadge({ status, map = POST_STATUS }) {
  const meta = map[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.class}`}>
      {meta.label}
    </span>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Đồng ý', danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Hủy
        </button>
        <button
          className={danger ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
