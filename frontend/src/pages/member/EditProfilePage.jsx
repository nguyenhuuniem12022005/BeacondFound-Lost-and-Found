import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { avatarOf } from '../../utils/format';

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const pickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const save = async () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Họ tên không được để trống';
    if (phone && !/^0\d{9,10}$/.test(phone)) errs.phone = 'Số điện thoại không hợp lệ';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      let avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('images', avatarFile);
        const up = await api.post('/upload/images', fd);
        avatarUrl = up.data.urls[0];
      }
      const res = await api.put('/users/profile', {
        fullName: fullName.trim(),
        phone: phone || null,
        ...(avatarUrl && { avatarUrl }),
      });
      updateUser(res.data.user);
      toast('Đã cập nhật hồ sơ!');
      navigate('/profile');
    } catch (err) {
      toast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-24">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
        <h1 className="border-b border-gray-100 pb-4 text-xl font-extrabold text-gray-900">Chỉnh sửa hồ sơ</h1>

        <div className="mt-6 flex flex-col items-center">
          <img
            src={avatarPreview || avatarOf(user)}
            alt=""
            className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-100"
          />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          <button onClick={() => fileRef.current?.click()} className="btn-secondary mt-3 text-xs">
            {Icon.camera('h-4 w-4')} Đổi ảnh đại diện
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Họ và tên *</label>
            <input className={`input ${errors.fullName ? 'border-red-400' : ''}`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <input className="input bg-gray-50 text-gray-400" value={user?.email} disabled />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                ✓ Đã xác minh
              </span>
            </div>
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <input className={`input ${errors.phone ? 'border-red-400' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0987654321" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button className="px-2 text-sm font-semibold text-gray-400 hover:text-gray-600" onClick={() => navigate(-1)}>
            Hủy
          </button>
          <button className="btn-primary px-6" onClick={save} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
