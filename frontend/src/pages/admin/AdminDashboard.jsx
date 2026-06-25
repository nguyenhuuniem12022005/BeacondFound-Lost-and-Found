import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, StatusBadge } from '../../components/common';
import { timeAgo, POST_STATUS, REPORT_STATUS } from '../../utils/format';

const ACTIVITY_STATUS = { ...POST_STATUS, ...REPORT_STATUS, ACTIVE: { label: 'Hoạt động', class: 'bg-emerald-100 text-emerald-700' } };

export default function AdminDashboard() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/admin/stats', { params: { period } })
      .then((res) => setData(res.data))
      .catch((err) => {
        setData(null);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading && !data) return <LoadingScreen />;
  if (!data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-card">
        <p className="font-bold text-red-600">Không thể tải dữ liệu thống kê</p>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  const { totals, activities } = data;

  const statCards = [
    { label: 'Người dùng mới', value: totals.newUsersInPeriod, sub: `Tổng: ${totals.totalUsers}`, icon: 'users', color: 'text-primary-600 bg-primary-50' },
    { label: 'Bài đăng mới', value: totals.newPostsInPeriod, sub: `Tổng: ${totals.totalPosts}`, icon: 'document', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Chờ duyệt', value: totals.pendingPosts, sub: 'bài đăng', icon: 'clock', color: 'text-amber-600 bg-amber-50', link: '/admin/posts' },
    { label: 'Đang hoạt động', value: totals.activePosts, sub: 'bài đăng', icon: 'check', color: 'text-blue-600 bg-blue-50' },
    { label: 'Báo cáo chờ xử lý', value: totals.pendingReports, sub: 'báo cáo', icon: 'shield', color: 'text-red-600 bg-red-50', link: '/admin/reports' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">Tổng quan hệ thống</h1>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {[
            { value: 'week', label: 'Tuần' },
            { value: 'month', label: 'Tháng' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                period === p.value ? 'bg-primary-700 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => (
          <Link
            key={c.label}
            to={c.link || '#'}
            className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-card ${c.link ? 'transition hover:shadow-lg' : 'pointer-events-none'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{c.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                {Icon[c.icon]('h-5 w-5')}
              </span>
            </div>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">{c.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{c.sub}</p>
          </Link>
        ))}
      </div>

      {/* Hoạt động gần đây */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Hoạt động gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Thời gian</th>
                <th className="px-5 py-3">Loại sự kiện</th>
                <th className="px-5 py-3">Người dùng</th>
                <th className="px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="whitespace-nowrap px-5 py-3 text-gray-400">{timeAgo(a.time)}</td>
                  <td className="px-5 py-3 font-medium text-gray-700">{a.event}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">{a.user}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={a.status} map={ACTIVITY_STATUS} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
