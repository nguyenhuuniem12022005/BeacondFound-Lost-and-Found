import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import PostCard from '../../components/PostCard';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState } from '../../components/common';

const TYPE_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'LOST', label: 'Mất đồ' },
  { value: 'FOUND', label: 'Nhặt được' },
];

const TIME_OPTIONS = [
  { value: '', label: 'Mọi thời gian' },
  { value: '1', label: 'Hôm nay' },
  { value: '7', label: '7 ngày qua' },
  { value: '30', label: '30 ngày qua' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [days, setDays] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    if (categoryId) params.categoryId = categoryId;
    if (tag) params.tag = tag;
    if (days) params.from = new Date(Date.now() - Number(days) * 86400000).toISOString();
    api
      .get('/search/posts', { params })
      .then((res) => setPosts(res.data.posts))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [keyword, type, categoryId, days, tag]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {keyword ? `Kết quả cho "${keyword}"` : 'Bài đăng mới nhất'}
        </h1>
        <div className="flex rounded-lg border border-primary-200 bg-white p-0.5">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                type === t.value ? 'bg-primary-700 text-white' : 'text-gray-600 hover:text-primary-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategoryId('')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            !categoryId
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
          }`}
        >
          Tất cả danh mục
        </button>
        {categories.slice(0, 6).map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(String(c.id) === categoryId ? '' : String(c.id))}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              String(c.id) === categoryId
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
            }`}
          >
            {c.name}
          </button>
        ))}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 outline-none"
        >
          <option value="">Khác...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 outline-none"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Lọc theo tag..."
          className="w-28 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 outline-none focus:border-primary-300"
        />
        <Link
          to="/map"
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-800"
        >
          {Icon.map('h-4 w-4')} Xem dạng Bản đồ
        </Link>
      </div>

      {/* Danh sách bài */}
      {loading ? (
        <LoadingScreen text="Đang tải bài đăng..." />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Icon.search('h-10 w-10')}
          title="Không tìm thấy bài đăng nào"
          description="Thử thay đổi từ khóa hoặc bộ lọc, hoặc trở thành người đầu tiên đăng tin tại khu vực của bạn."
          action={
            <Link to="/create-post" className="btn-primary">
              {Icon.plus('h-4 w-4')} Đăng bài ngay
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
