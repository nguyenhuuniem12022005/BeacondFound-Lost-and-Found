import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { LoadingScreen, TypeBadge, StatusBadge, ConfirmModal } from '../../components/common';
import { timeAgo, REPORT_STATUS, avatarOf } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

export default function AdminReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'ignore' | 'deletePost' | 'lockUser'

  const load = () => {
    api
      .get(`/admin/reports/${id}`)
      .then((res) => setReport(res.data.report))
      .catch(() => navigate('/admin/reports'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const act = async () => {
    setBusy(true);
    try {
      if (confirm === 'ignore') {
        await api.put(`/admin/reports/${id}/reject`);
        toast('Đã bỏ qua báo cáo');
        navigate('/admin/reports');
        return;
      }
      if (confirm === 'deletePost' && report.post) {
        await api.delete(`/posts/${report.post.id}`);
        await api.put(`/admin/reports/${id}/resolve`);
        toast('Đã xóa bài đăng vi phạm và đánh dấu báo cáo đã giải quyết');
        navigate('/admin/reports');
        return;
      }
      if (confirm === 'lockUser') {
        const targetUserId = report.reportedUser?.id || report.post?.user?.id;
        if (targetUserId) {
          await api.put(`/users/${targetUserId}/lock`);
        }
        await api.put(`/admin/reports/${id}/resolve`);
        toast('Đã khóa tài khoản vi phạm và đánh dấu báo cáo đã giải quyết');
        navigate('/admin/reports');
        return;
      }
      if (confirm === 'resolve') {
        await api.put(`/admin/reports/${id}/resolve`);
        toast('Đã đánh dấu báo cáo là đã giải quyết');
        navigate('/admin/reports');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!report) return null;

  const targetUser = report.reportedUser || report.post?.user;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/admin/reports" className="hover:text-primary-700">
          Báo cáo
        </Link>
        <span>›</span>
        <span className="font-bold text-gray-700">#R-{report.id}</span>
        <span className="ml-auto">
          <StatusBadge status={report.status} map={REPORT_STATUS} />
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Nội dung báo cáo */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <h2 className="font-bold text-gray-900">Nội dung báo cáo</h2>
            <div className="mt-4 flex items-center gap-3">
              <img src={avatarOf(report.reporter)} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="font-bold text-gray-800">{report.reporter?.fullName}</p>
                <p className="text-xs text-gray-400">
                  {report.reporter?.email} • {timeAgo(report.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-primary-50/60 p-4">
              <p className="text-xs font-bold uppercase text-primary-700">Mô tả chi tiết:</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-700">{report.reason}</p>
            </div>
          </div>

          {/* Đối tượng bị báo cáo */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Đối tượng bị báo cáo</h2>
              {report.post && (
                <Link to={`/admin/posts/${report.post.id}`} className="flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline">
                  Mở trang gốc ↗
                </Link>
              )}
            </div>
            {report.post ? (
              <div className="mt-4 flex gap-4 rounded-xl border border-gray-100 p-4">
                <div className="h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {report.post.images?.[0] ? (
                    <img src={report.post.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">{Icon.camera('h-7 w-7')}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={report.post.type} />
                    <span className="text-xs text-gray-400">POST #{report.post.id}</span>
                  </div>
                  <p className="mt-1 font-bold text-gray-900">{report.post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{report.post.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    {Icon.user('h-3.5 w-3.5')} Đăng bởi: {report.post.user?.fullName}
                  </p>
                </div>
              </div>
            ) : report.reportedUser ? (
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-gray-100 p-4">
                <img src={avatarOf(report.reportedUser)} alt="" className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-gray-900">{report.reportedUser.fullName}</p>
                  <p className="text-sm text-gray-400">{report.reportedUser.email}</p>
                  <p className="mt-1 text-xs">
                    Trạng thái tài khoản:{' '}
                    <span className={report.reportedUser.status === 'LOCKED' ? 'font-bold text-red-600' : 'font-bold text-emerald-600'}>
                      {report.reportedUser.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">Đối tượng không còn tồn tại.</p>
            )}
          </div>
        </div>

        {/* Xử lý báo cáo */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="font-bold text-gray-900">Xử lý báo cáo</h2>
            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => setConfirm('ignore')}
                disabled={busy || report.status !== 'PENDING'}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {Icon.eye('h-4 w-4')} Bỏ qua báo cáo
              </button>
              {report.post && (
                <button
                  onClick={() => setConfirm('deletePost')}
                  disabled={busy || report.status !== 'PENDING'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-40"
                >
                  {Icon.trash('h-4 w-4')} Xóa bài đăng vi phạm
                </button>
              )}
              {targetUser && (
                <button
                  onClick={() => setConfirm('lockUser')}
                  disabled={busy || report.status !== 'PENDING'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-40"
                >
                  {Icon.lock('h-4 w-4')} Khóa tài khoản người dùng
                </button>
              )}
              <button
                onClick={() => setConfirm('resolve')}
                disabled={busy || report.status !== 'PENDING'}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
              >
                {Icon.check('h-4 w-4')} Đánh dấu đã giải quyết
              </button>
            </div>
            {report.status !== 'PENDING' && (
              <p className="mt-3 text-center text-xs text-gray-400">Báo cáo này đã được xử lý.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={act}
        loading={busy}
        danger={confirm !== 'resolve' && confirm !== 'ignore'}
        title={
          confirm === 'ignore'
            ? 'Bỏ qua báo cáo'
            : confirm === 'deletePost'
            ? 'Xóa bài đăng vi phạm'
            : confirm === 'lockUser'
            ? 'Khóa tài khoản'
            : 'Đánh dấu đã giải quyết'
        }
        message={
          confirm === 'ignore'
            ? 'Báo cáo sẽ được đánh dấu là không đủ căn cứ và bị bỏ qua.'
            : confirm === 'deletePost'
            ? `Xóa bài đăng "${report.post?.title}" và đánh dấu báo cáo đã giải quyết?`
            : confirm === 'lockUser'
            ? `Khóa tài khoản "${targetUser?.fullName}"? Người dùng sẽ không thể đăng nhập và các bài đang hoạt động sẽ bị gỡ.`
            : 'Đánh dấu báo cáo này là đã giải quyết và thông báo cho người báo cáo?'
        }
        confirmText={confirm === 'lockUser' ? 'Xác nhận khóa' : 'Đồng ý'}
      />
    </div>
  );
}
