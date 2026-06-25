import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Icon from '../../components/Icons';
import { useToast } from '../../context/ToastContext';
import CreatePostStep1Panel from './createpost/CreatePostStep1Panel';
import CreatePostStep2Panel from './createpost/CreatePostStep2Panel';
import CreatePostStep3Panel from './createpost/CreatePostStep3Panel';
import CreatePostStep4Panel from './createpost/CreatePostStep4Panel';

const STEPS = [
  { num: 1, label: 'Loại tin' },
  { num: 2, label: 'Mô tả' },
  { num: 3, label: 'Vị trí' },
  { num: 4, label: 'Hình ảnh & Tag' },
];

const DEFAULT_CENTER = [10.7769, 106.7009];

/**
 * CreatePostPage - giao diện tổng thể quản lý tiến trình đăng bài 4 bước.
 */
export default function CreatePostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // postDraft - dữ liệu bài đăng đang soạn
  const [type, setType] = useState('LOST');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState(DEFAULT_CENTER);
  const [geocoding, setGeocoding] = useState(false);
  const [files, setFiles] = useState([]); // {file, preview}
  const [tags, setTags] = useState([]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  const nextStep = () => setCurrentStep((s) => Math.min(4, s + 1));
  const previousStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const submitPost = async () => {
    setSubmitting(true);
    try {
      // 1. Upload ảnh
      let imageUrls = [];
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('images', f.file));
        const up = await api.post('/upload/images', fd);
        imageUrls = up.data.urls;
      }
      // 2. Tạo bài đăng (trạng thái PENDING)
      await api.post('/posts', {
        title: title.trim(),
        type,
        description: description.trim(),
        eventDate: new Date(eventDate).toISOString(),
        address: address.trim(),
        latitude: position[0],
        longitude: position[1],
        categoryId: categoryId || null,
        images: imageUrls,
        tags,
      });
      toast('Đăng bài thành công! Bài viết sẽ hiển thị sau khi Admin duyệt.');
      navigate('/profile');
    } catch (err) {
      toast(err.response?.data?.message || 'Đăng bài thất bại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-primary-100 bg-white px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold text-primary-700">
          {Icon.back('h-5 w-5')} <span>BeacondFound</span>
        </button>
        <Link to="/home" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          {Icon.x('h-5 w-5')}
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-8">
          {/* Stepper */}
          <div className="mb-8 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      currentStep > s.num
                        ? 'bg-primary-700 text-white'
                        : currentStep === s.num
                        ? 'bg-primary-700 text-white ring-4 ring-primary-100'
                        : 'bg-primary-100 text-primary-300'
                    }`}
                  >
                    {currentStep > s.num ? Icon.check('h-4 w-4') : s.num}
                  </div>
                  <span
                    className={`mt-1.5 hidden text-[11px] font-semibold sm:block ${
                      currentStep >= s.num ? 'text-primary-700' : 'text-gray-300'
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 mb-5 h-0.5 flex-1 rounded ${currentStep > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <CreatePostStep1Panel
              type={type}
              setType={setType}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              title={title}
              setTitle={setTitle}
              categories={categories}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <CreatePostStep2Panel
              description={description}
              setDescription={setDescription}
              eventDate={eventDate}
              setEventDate={setEventDate}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {currentStep === 3 && (
            <CreatePostStep3Panel
              address={address}
              setAddress={setAddress}
              position={position}
              setPosition={setPosition}
              geocoding={geocoding}
              setGeocoding={setGeocoding}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {currentStep === 4 && (
            <CreatePostStep4Panel
              files={files}
              setFiles={setFiles}
              tags={tags}
              setTags={setTags}
              submitting={submitting}
              onBack={previousStep}
              onSubmit={submitPost}
            />
          )}
        </div>
      </div>
    </div>
  );
}
