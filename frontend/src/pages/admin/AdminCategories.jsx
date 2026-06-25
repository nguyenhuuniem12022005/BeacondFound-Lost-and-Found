import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState, Modal, ConfirmModal } from '../../components/common';
import { useToast } from '../../context/ToastContext';

const CATEGORY_ICONS = ['wallet', 'phone', 'document', 'key', 'laptop', 'headphone', 'bag', 'pet', 'device', 'other'];

function CategoryIcon({ name, cls = 'h-5 w-5' }) {
  const icons = {
    wallet: Icon.wallet(cls),
    phone: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    document: Icon.document(cls),
    key: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    laptop: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    headphone: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V12a9 9 0 0118 0v1.5m-18 0A2.25 2.25 0 015.25 11.25h.75a.75.75 0 01.75.75v6a.75.75 0 01-.75.75h-.75A2.25 2.25 0 013 16.5v-3zm18 0a2.25 2.25 0 00-2.25-2.25H18a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h.75A2.25 2.25 0 0021 16.5v-3z" />
      </svg>
    ),
    bag: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
    pet: (
      <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
        <circle cx="6" cy="9" r="2" /><circle cx="10.5" cy="5.5" r="2" /><circle cx="13.5" cy="5.5" r="2" transform="translate(4.5 0)" /><circle cx="18" cy="9" r="2" />
        <path d="M12 10c-2.5 0-5.5 3-5.5 5.5 0 1.7 1.3 2.5 2.6 2.5 1 0 1.9-.5 2.9-.5s1.9.5 2.9.5c1.3 0 2.6-.8 2.6-2.5C17.5 13 14.5 10 12 10z" />
      </svg>
    ),
    device: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
    other: (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  };
  return icons[name] || icons.other;
}

export default function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode:'add'} | {mode:'edit', category}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('wallet');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    setName('');
    setIcon('wallet');
    setModal({ mode: 'add' });
  };

  const openEdit = (c) => {
    setName(c.name);
    setIcon(c.icon || 'other');
    setModal({ mode: 'edit', category: c });
  };

  const save = async () => {
    if (!name.trim()) {
      toast('Vui lòng nhập tên danh mục', 'error');
      return;
    }
    setBusy(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/categories', { name, icon });
        toast('Đã thêm danh mục mới');
      } else {
        await api.put(`/categories/${modal.category.id}`, { name, icon });
        toast('Đã cập nhật danh mục');
      }
      setModal(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      toast('Đã xóa danh mục');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Xóa thất bại', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý danh mục</h1>
        <button onClick={openAdd} className="btn-primary">
          {Icon.plus('h-4 w-4')} Thêm danh mục
        </button>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.id} className="group relative rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition hover:shadow-lg">
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(c)} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-primary-700">
                  {Icon.edit('h-4 w-4')}
                </button>
                <button onClick={() => setDeleteTarget(c)} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-red-600">
                  {Icon.trash('h-4 w-4')}
                </button>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <CategoryIcon name={c.icon} cls="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-bold text-gray-900">{c.name}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                {Icon.document('h-3.5 w-3.5')} {c._count?.posts ?? 0} bài đăng
              </p>
            </div>
          ))}
          {/* Card thêm mới */}
          <button
            onClick={openAdd}
            className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary-300 text-primary-500 transition hover:bg-primary-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              {Icon.plus('h-6 w-6')}
            </span>
            <span className="text-sm font-bold">Tạo danh mục mới</span>
          </button>
        </div>
      )}

      {/* Modal thêm/sửa */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Thêm danh mục mới' : 'Sửa danh mục'}
      >
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
          <button className="btn-secondary" onClick={() => setModal(null)} disabled={busy}>
            Hủy
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        loading={busy}
        title="Xóa danh mục"
        message={`Xóa danh mục "${deleteTarget?.name}"? Các bài đăng thuộc danh mục này sẽ chuyển thành "Không có danh mục".`}
        confirmText="Xóa"
      />
    </div>
  );
}
