import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, EmptyState, StatusBadge } from '../../components/common';
import { timeAgo, REPORT_STATUS, avatarOf } from '../../utils/format';

const TABS = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'REJECTED', label: 'Đã bỏ qua' },
  { value: '', label: 'Tất cả' },
];

export default function AdminReports() {
  const [tab, setTab] = useState('PENDING');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/reports', { params: tab ? { status: tab } : {} })
      .then((res) => setReports(res.data.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = reports.filter(
    (r) =>
      r.reporter?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.post?.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedUser?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      String(r.id).includes(search)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Quản lý báo cáo vi phạm</h1>
        <p className="mt-1 text-sm text-gray-400">Theo dõi và xử lý các báo cáo từ cộng đồng.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold transition ${
                tab === t.value ? 'border-primary-700 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {Icon.search('h-4 w-4')}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo ID, người báo cáo..."
            className="input w-64 pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.shield('h-10 w-10')} title="Không có báo cáo" description="Không có báo cáo nào trong mục này." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Người gửi</th>
                  <th className="px-5 py-3">Đối tượng bị báo cáo</th>
                  <th className="px-5 py-3">Lý do</th>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-bold text-gray-500">#R-{r.id}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="flex items-center gap-2">
                        <img src={avatarOf(r.reporter)} alt="" className="h-6 w-6 rounded-full object-cover" />
                        <span className="text-gray-700">{r.reporter?.fullName}</span>
                      </span>
                    </td>
                    <td className="max-w-[14rem] px-5 py-3">
                      {r.post ? (
                        <Link to={`/admin/posts/${r.post.id}`} className="line-clamp-1 font-semibold text-primary-700 hover:underline">
                          📄 {r.post.title}
                        </Link>
                      ) : r.reportedUser ? (
                        <span className="font-semibold text-gray-700">👤 {r.reportedUser.fullName}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <p className="line-clamp-1 text-gray-500">{r.reason}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-400">{timeAgo(r.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} map={REPORT_STATUS} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <Link
                        to={`/admin/reports/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-primary-300 hover:text-primary-700"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-gray-50 px-5 py-3 text-xs text-gray-400">Đang xem {filtered.length} báo cáo</p>
        </div>
      )}
    </div>
  );
}
