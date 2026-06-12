export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export const POST_STATUS = {
  PENDING: { label: 'Chờ duyệt', class: 'bg-amber-100 text-amber-700' },
  ACTIVE: { label: 'Đang hoạt động', class: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Bị từ chối', class: 'bg-red-100 text-red-700' },
  RESOLVED: { label: 'Đã tìm thấy', class: 'bg-blue-100 text-blue-700' },
  DELETED: { label: 'Đã xóa', class: 'bg-gray-100 text-gray-500' },
};

export const REPORT_STATUS = {
  PENDING: { label: 'Chờ xử lý', class: 'bg-amber-100 text-amber-700' },
  RESOLVED: { label: 'Đã giải quyết', class: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Đã bỏ qua', class: 'bg-gray-100 text-gray-600' },
};

export const NOTIFICATION_META = {
  POST_APPROVED: { icon: 'check', color: 'bg-emerald-100 text-emerald-600' },
  POST_REJECTED: { icon: 'x', color: 'bg-red-100 text-red-600' },
  POST_DELETED: { icon: 'x', color: 'bg-red-100 text-red-600' },
  NEW_MESSAGE: { icon: 'chat', color: 'bg-primary-100 text-primary-600' },
  REPORT_RESOLVED: { icon: 'shield', color: 'bg-blue-100 text-blue-600' },
  REPORT_REJECTED: { icon: 'shield', color: 'bg-gray-100 text-gray-600' },
  SYSTEM: { icon: 'info', color: 'bg-sky-100 text-sky-600' },
};

export function avatarOf(user) {
  return (
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?background=cd3033&color=fff&name=${encodeURIComponent(user?.fullName || 'U')}`
  );
}
