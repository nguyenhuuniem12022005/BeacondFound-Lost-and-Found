import { useEffect, useState } from 'react';
import { Modal } from '../../../components/common';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { CATEGORY_ICONS, CategoryIcon } from './categoryIcons';

export default function EditCategoryModal({ open, onClose, category, onSubmitted }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('wallet');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setIcon(category.icon || 'other');
    }
  }, [open, category]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Vui lòng nhập tên danh mục', 'error');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/categories/${category.id}`, { name, icon });
      toast('Đã cập nhật danh mục');
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      toast(err.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => onClose?.();

  return (
    <Modal open={open} onClose={handleCancel} title="Sửa danh mục">
      <div className="space-y-4">
        <div>
          <label className="label">Tên danh mục *</label>
          <input className="input" placeholder="Nhập tên danh mục..." value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Chọn biểu tượng *</label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`flex h-12 items-center justify-center rounded-xl border-2 transition ${
                  icon === ic ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-primary-200'
                }`}
              >
                <CategoryIcon name={ic} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={handleCancel} disabled={busy}>
          Hủy
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={busy}>
          {busy ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </Modal>
  );
}
