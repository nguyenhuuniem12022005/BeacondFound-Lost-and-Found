# BeacondFound — Hệ thống tìm kiếm đồ thất lạc

Nền tảng web kết nối **người bị mất đồ** và **người nhặt được đồ**: đăng tin báo mất/nhặt được, tìm kiếm theo danh sách hoặc bản đồ, nhắn tin nội bộ realtime, thông báo realtime, báo cáo vi phạm và trang quản trị kiểm duyệt nội dung + thống kê.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | ReactJS (Vite), React Router, Axios, Tailwind CSS, Leaflet.js, Socket.io-client, Recharts |
| Backend | Node.js, Express.js, Prisma ORM, Socket.io, JWT, Bcrypt, Multer |
| Database | PostgreSQL |
| Dịch vụ ngoài | Cloudinary (upload ảnh), Google Vision (gợi ý tag), FCM (push notification) — **đều có mock service**, chỉ cần điền API key vào `.env` là dùng bản thật |

## Cấu trúc thư mục

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (10 bảng)
│   │   └── seed.js              # Dữ liệu mẫu
│   ├── scripts/dev-db.js        # PostgreSQL portable cho dev (không cần cài Postgres)
│   └── src/
│       ├── config/              # Prisma client
│       ├── controllers/         # auth, user, category, post, search, conversation, notification, report, stats, upload
│       ├── middlewares/         # JWT auth, admin check, error handler
│       ├── routes/              # Khai báo RESTful API
│       ├── services/            # upload (Cloudinary/mock), vision (Google Vision/mock), fcm (mock), notification, geo (Haversine)
│       ├── socket/              # Socket.io (chat + notification realtime)
│       └── server.js
└── frontend/
    └── src/
        ├── api/                 # Axios instance
        ├── components/          # PostCard, Modal, Toast, ReportModal, icons...
        ├── context/             # AuthContext, SocketContext, ToastContext
        ├── layouts/             # MemberLayout (sidebar), AdminLayout (sidebar tối)
        ├── pages/
        │   ├── public/          # Landing, Login, Register
        │   ├── member/          # Home, MapSearch, PostDetail, CreatePost (4 bước), EditPost, Profile, EditProfile, Notifications, Messages
        │   └── admin/           # Dashboard/Thống kê, Posts, PostDetail, Categories, Reports, ReportDetail, Users
        └── utils/
```

## Cài đặt & chạy

> Yêu cầu: **Node.js >= 18**. PostgreSQL **không bắt buộc** phải cài sẵn (đã có script chạy PostgreSQL portable).

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env       # Windows (Linux/Mac: cp .env.example .env)
```

**Khởi động database** (chọn 1 trong 2):

- **Cách A — chưa cài PostgreSQL (khuyên dùng cho dev):**

```bash
npm run db:dev
```

Lệnh này tự tải binaries PostgreSQL portable, khởi tạo cluster tại `D:\beacondfound-pg` và chạy ở cổng **5433** (giữ terminal này mở).

- **Cách B — đã có PostgreSQL:** tạo database `beacondfound` rồi sửa `DATABASE_URL` trong `backend/.env` cho đúng user/password/port.

**Chạy migration** (terminal mới):

```bash
cd backend
npx prisma migrate dev --name init
```

**Chạy seed dữ liệu mẫu:**

```bash
npm run seed
```

(Lệnh `prisma migrate dev` lần đầu cũng tự chạy seed.)

**Khởi động API server:**

```bash
npm run dev          # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### 3. Chạy test (kiểu JUnit)

Bộ test tự động dùng **Jest + Supertest**, kiểm tra toàn bộ chức năng backend (auth, bài đăng, duyệt bài, tìm kiếm, bản đồ, chat, thông báo, báo cáo, khóa tài khoản, thống kê, upload, AI tags).

```bash
cd backend
# Yêu cầu: database dev đang chạy (npm run db:dev)
npm test
```

- Test chạy trên database riêng `beacondfound_test` (tự tạo + dọn sạch mỗi lần chạy), **không ảnh hưởng dữ liệu development**.
- Các file test nằm trong `backend/tests/`, chia theo từng nhóm chức năng (`01-unit-geo` → `10-upload-ai`).

## Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@beacondfound.com` | `123456` |
| Member | `member1@beacondfound.com` | `123456` |
| Member | `member2@beacondfound.com` | `123456` |

Seed bao gồm: 10 danh mục, 10 bài đăng (LOST/FOUND với trạng thái ACTIVE/PENDING), thông báo, báo cáo vi phạm, cuộc trò chuyện + tin nhắn mẫu.

## Tích hợp API thật (tùy chọn)

Mở `backend/.env` và điền key — không cần sửa code:

```env
# Cloudinary — nếu trống: ảnh lưu local tại backend/uploads
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Google Vision — nếu trống: mock trả tag mẫu theo tên file
GOOGLE_VISION_API_KEY=...

# Firebase Cloud Messaging — nếu trống: mock log console (realtime vẫn có Socket.io)
FCM_SERVER_KEY=...
```

## API chính

```
POST   /api/auth/register | /api/auth/login        GET /api/auth/me
GET    /api/users/profile  PUT /api/users/profile
GET|POST /api/categories   PUT|DELETE /api/categories/:id
GET    /api/posts          GET /api/posts/:id      POST /api/posts
PUT    /api/posts/:id      DELETE /api/posts/:id
GET    /api/admin/posts/pending
PUT    /api/admin/posts/:id/approve | /reject
GET    /api/search/posts   GET /api/search/map     (Haversine, bán kính km)
GET|POST /api/conversations              GET /api/conversations/:id
GET|POST /api/conversations/:id/messages
GET    /api/notifications  PUT /api/notifications/:id/read | /read-all
POST   /api/reports        GET /api/admin/reports  GET /api/admin/reports/:id
PUT    /api/admin/reports/:id/resolve | /reject
PUT    /api/admin/reports/:id/lock-user
GET    /api/admin/stats?period=week|month
POST   /api/upload/images  POST /api/ai/suggest-tags
```

## Quy tắc nghiệp vụ chính

- Bài đăng mới / bài ACTIVE bị sửa → trạng thái `PENDING`, chờ admin duyệt.
- Chỉ bài `ACTIVE` hiển thị ở trang tìm kiếm công khai.
- Admin từ chối bài `PENDING` → bài bị xóa vĩnh viễn và thành viên nhận thông báo.
- Duyệt/từ chối bài, tin nhắn mới, xử lý báo cáo → tạo notification (realtime qua Socket.io).
- Member chỉ sửa/xóa được bài của mình; thao tác xóa sẽ xóa vĩnh viễn bài khỏi cơ sở dữ liệu.
- Admin chỉ khóa tài khoản thông qua xử lý báo cáo; tài khoản `LOCKED` không thể mở khóa và các bài đang hiển thị bị xóa vĩnh viễn.
- Tìm kiếm bản đồ tính khoảng cách bằng công thức **Haversine** ở backend.
