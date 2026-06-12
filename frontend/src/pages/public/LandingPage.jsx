import { Link } from 'react-router-dom';
import Icon from '../../components/Icons';

const FEATURES = [
  {
    icon: 'search',
    title: 'Tìm kiếm thông minh',
    desc: 'Tìm theo từ khóa, danh mục, thẻ tag hoặc khoanh vùng vị trí trên bản đồ số với bán kính tùy chọn.',
  },
  {
    icon: 'map',
    title: 'Bản đồ trực quan',
    desc: 'Mọi bài đăng được ghim chính xác trên bản đồ Leaflet, giúp bạn khoanh vùng đồ vật nhanh chóng.',
  },
  {
    icon: 'chat',
    title: 'Nhắn tin an toàn',
    desc: 'Trao đổi trực tiếp với người nhặt/mất đồ qua hộp thư nội bộ, không cần công khai số điện thoại.',
  },
  {
    icon: 'sparkles',
    title: 'AI gợi ý thẻ',
    desc: 'Hệ thống AI Vision phân tích ảnh và gợi ý thẻ mô tả, giúp bài đăng dễ được tìm thấy hơn.',
  },
  {
    icon: 'shield',
    title: 'Kiểm duyệt nội dung',
    desc: 'Mọi bài đăng đều được quản trị viên kiểm duyệt trước khi hiển thị, hạn chế tin giả và lừa đảo.',
  },
  {
    icon: 'bell',
    title: 'Thông báo realtime',
    desc: 'Nhận thông báo tức thì khi bài đăng được duyệt, có tin nhắn mới hoặc báo cáo được xử lý.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-primary-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-primary-700">{Icon.pin('h-6 w-6')}</span>
            <span className="text-xl font-extrabold tracking-tight text-primary-700">BeacondFound</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-700">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-primary">
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="mb-4 inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700">
            Nền tảng kết nối cộng đồng
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl">
            Đánh rơi đồ?
            <br />
            <span className="text-primary-700">BeacondFound</span> giúp bạn tìm lại.
          </h1>
          <p className="mt-4 max-w-lg text-gray-600">
            Hệ thống tìm kiếm đồ thất lạc kết nối người bị mất đồ và người nhặt được. Đăng tin, tìm
            kiếm theo bản đồ, nhắn tin an toàn và nhận thông báo thời gian thực — tất cả trong một nền
            tảng.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Bắt đầu ngay
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              Tôi đã có tài khoản
            </Link>
          </div>
          <div className="mt-10 flex gap-8 text-center">
            <div>
              <p className="text-2xl font-extrabold text-primary-700">1.000+</p>
              <p className="text-xs text-gray-500">Bài đăng</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary-700">500+</p>
              <p className="text-xs text-gray-500">Đồ vật đã trả lại</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-primary-700">24/7</p>
              <p className="text-xs text-gray-500">Hỗ trợ cộng đồng</p>
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="absolute -inset-6 rounded-3xl bg-primary-100/70 blur-2xl" />
          <div className="relative rounded-3xl border border-primary-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-primary-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
            </div>
            <div className="space-y-3">
              {[
                { type: 'Mất đồ', color: 'bg-primary-600', title: 'Ví da nam màu nâu', place: 'Quận 1, TP.HCM' },
                { type: 'Nhặt được', color: 'bg-emerald-600', title: 'Chùm chìa khóa nhà', place: 'Lotte Mart, Q.7' },
                { type: 'Mất đồ', color: 'bg-primary-600', title: 'Mèo anh lông ngắn vàng', place: 'Bình Thạnh' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    {Icon.camera('h-6 w-6')}
                  </div>
                  <div className="flex-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${item.color}`}>
                      {item.type}
                    </span>
                    <p className="text-sm font-bold text-gray-800">{item.title}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      {Icon.pin('h-3 w-3')} {item.place}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Vì sao chọn <span className="text-primary-700">BeacondFound</span>?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-gray-500">
            Nền tảng chuyên biệt thay thế các bài đăng rời rạc trên mạng xã hội — chuẩn hóa, an toàn và
            hiệu quả.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 p-6 shadow-card transition hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                  {Icon[f.icon]('h-6 w-6')}
                </div>
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-primary-700 px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold">Sẵn sàng tìm lại đồ vật của bạn?</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-100">
            Tham gia cộng đồng BeacondFound ngay hôm nay. Hoàn toàn miễn phí.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 font-bold text-primary-700 shadow-lg transition hover:bg-primary-50"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>

      <footer className="border-t border-primary-100 bg-white py-6 text-center text-sm text-gray-400">
        © 2026 BeacondFound — Hệ thống tìm kiếm đồ thất lạc.
      </footer>
    </div>
  );
}
