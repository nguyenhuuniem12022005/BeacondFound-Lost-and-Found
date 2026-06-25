import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen } from '../../components/common';
import { CategoryIcon } from './categories/categoryIcons';
import AddCategoryModal from './categories/AddCategoryModal';
import EditCategoryModal from './categories/EditCategoryModal';
import ConfirmDeleteCategoryModal from './categories/ConfirmDeleteCategoryModal';

export default function ManageCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadCategories = () => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadCategories, []);

  const handleAddCategory = () => setAddOpen(true);

  const handleEditCategory = (c) => {
    setSelectedCategory(c);
    setEditOpen(true);
  };

  const handleDeleteCategory = (c) => {
    setSelectedCategory(c);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý danh mục</h1>
        <button onClick={handleAddCategory} className="btn-primary">
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
                <button onClick={() => handleEditCategory(c)} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-primary-700">
                  {Icon.edit('h-4 w-4')}
                </button>
                <button onClick={() => handleDeleteCategory(c)} className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:text-red-600">
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
            onClick={handleAddCategory}
            className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary-300 text-primary-500 transition hover:bg-primary-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              {Icon.plus('h-6 w-6')}
            </span>
            <span className="text-sm font-bold">Tạo danh mục mới</span>
          </button>
        </div>
      )}

      <AddCategoryModal open={addOpen} onClose={() => setAddOpen(false)} onSubmitted={loadCategories} />
      <EditCategoryModal open={editOpen} onClose={() => setEditOpen(false)} category={selectedCategory} onSubmitted={loadCategories} />
      <ConfirmDeleteCategoryModal open={deleteOpen} onClose={() => setDeleteOpen(false)} category={selectedCategory} onDeleted={loadCategories} />
    </div>
  );
}
