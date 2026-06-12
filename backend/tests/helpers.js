/**
 * Các hàm tiện ích dùng chung cho test (tương tự TestFixture/TestHelper bên JUnit).
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');

const { createApp } = require('../src/app');
const prisma = require('../src/config/prisma');

const app = createApp();

let counter = 0;
/** Sinh email duy nhất cho mỗi lần gọi để các test không đụng nhau */
function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}@test.beacondfound.com`;
}

/** Header Authorization Bearer */
function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

/** Đăng ký 1 member mới qua API, trả về { token, user, email, password } */
async function registerMember(overrides = {}) {
  const body = {
    fullName: 'Thành viên Test',
    email: uniqueEmail('member'),
    password: '123456',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) {
    throw new Error(`registerMember thất bại: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user, email: body.email, password: body.password };
}

/** Tạo admin trực tiếp trong DB (đăng ký công khai chỉ tạo MEMBER) rồi login */
async function createAdmin() {
  const email = uniqueEmail('admin');
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: { fullName: 'Admin Test', email, passwordHash, role: 'ADMIN' },
  });
  const res = await request(app).post('/api/auth/login').send({ email, password: '123456' });
  return { token: res.body.token, user, email, password: '123456' };
}

/** Payload bài đăng hợp lệ mặc định */
function samplePost(overrides = {}) {
  return {
    title: 'Nhặt được ví da test',
    type: 'FOUND',
    description: 'Nhặt được ví da màu đen gần hồ Gươm (dữ liệu test)',
    eventDate: new Date().toISOString(),
    address: 'Hồ Gươm, Hoàn Kiếm, Hà Nội',
    latitude: 21.0285,
    longitude: 105.8542,
    tags: ['ví da', 'test'],
    ...overrides,
  };
}

/** Tạo bài đăng qua API, trả về post (status PENDING) */
async function createPost(token, overrides = {}) {
  const res = await request(app).post('/api/posts').set(auth(token)).send(samplePost(overrides));
  if (res.status !== 201) {
    throw new Error(`createPost thất bại: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.post;
}

/** Tạo bài đăng + admin duyệt luôn -> ACTIVE */
async function createActivePost(memberToken, adminToken, overrides = {}) {
  const post = await createPost(memberToken, overrides);
  const res = await request(app)
    .put(`/api/admin/posts/${post.id}/approve`)
    .set(auth(adminToken));
  if (res.status !== 200) {
    throw new Error(`approvePost thất bại: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.post;
}

module.exports = {
  app,
  request,
  prisma,
  uniqueEmail,
  auth,
  registerMember,
  createAdmin,
  samplePost,
  createPost,
  createActivePost,
};
