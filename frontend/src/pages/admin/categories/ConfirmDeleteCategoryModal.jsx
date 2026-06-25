import { useEffect, useState } from 'react';
import { ConfirmModal } from '../../../components/common';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';

export default function ConfirmDeleteCategoryModal({ open, onClose, category, onDeleted }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [postCount, setPostCount] = useState(null);

  // Lấy số bài đăng thuộc danh mục qua PostController.countPostsByCategory
  useEffect(() => {
    if (open && category) {
      setPostCount(null);
      api
        .get(`/categories/${category.id}/post-count`)
        .then((res) => setPostCount(res.data.count))
        .catch(() => setPostCount(null));
    }
  }, [open, category]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await api.delete(`/categories/${category.id}`);
      toast('Đã xóa danh mục');
      onDeleted?.();
      onClose?.();
    } catch (err) {
      toast(err.response?.data?.message || 'Xóa thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => onClose?.();

  const message =
    postCount > 0
      ? `Xóa danh mục "${category?.name}"? Có ${postCount} bài đăng thuộc danh mục này sẽ chuyển thành "Không có danh mục".`
      : `Xóa danh mục "${category?.name}"? Các bài đăng thuộc danh mục này sẽ chuyển thành "Không có danh mục".`;

  return (
    <ConfirmModal
      open={open}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      loading={busy}
      title="Xóa danh mục"
      message={message}
      confirmText="Xóa"
    />
  );
}
