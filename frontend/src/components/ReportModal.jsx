import { useState } from 'react';
import api from '../api/axios';
import { Modal } from './common';
import { useToast } from '../context/ToastContext';

export default function ReportModal({ open, onClose, postId, reportedUserId, targetName }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast('Vui lòng nhập nội dung vi phạm', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reports', { postId, reportedUserId, reason });
      toast('Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn!');
      setReason('');
      onClose();
    } catch (err) {
      toast(err.response?.data?.message || 'Gửi báo cáo thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Báo cáo vi phạm">
      <p className="text-sm text-gray-500">
        Cảm ơn bạn đã giúp giữ cộng đồng an toàn.{' '}
        {targetName && <span>Bạn đang báo cáo <b>{targetName}</b>.</span>} Vui lòng mô tả nội dung vi
        phạm:
      </p>
      <div className="mt-4">
        <label className="label">Mô tả chi tiết *</label>
        <textarea
          rows={4}
          className="input resize-none"
          placeholder="Vui lòng cung cấp thêm thông tin để chúng tôi xử lý nhanh hơn..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Hủy
        </button>
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
        </button>
      </div>
    </Modal>
  );
}
