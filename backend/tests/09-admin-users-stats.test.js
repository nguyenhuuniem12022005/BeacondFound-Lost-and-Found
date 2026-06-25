/**
 * TEST CHỨC NĂNG: Khóa tài khoản qua xử lý vi phạm + Thống kê admin + Hồ sơ cá nhân
 */
const {
  app,
  request,
  prisma,
  auth,
  registerMember,
  createAdmin,
} = require('./helpers');

let admin;
let member;

beforeAll(async () => {
  admin = await createAdmin();
  member = await registerMember();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Hồ sơ cá nhân', () => {
  test('GET /api/users/profile -> 200, có danh sách bài của mình', async () => {
    const res = await request(app).get('/api/users/profile').set(auth(member.token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(member.user.id);
    expect(Array.isArray(res.body.user.posts)).toBe(true);
  });

  test('PUT /api/users/profile -> cập nhật tên và SĐT', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set(auth(member.token))
      .send({ fullName: 'Tên Mới Sau Cập Nhật', phone: '0911222333' });
    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe('Tên Mới Sau Cập Nhật');
    expect(res.body.user.phone).toBe('0911222333');
  });
});

describe('GET /api/admin/stats - Thống kê', () => {
  test('admin -> 200, có totals + chart 7 ngày (week)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .query({ period: 'week' })
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.totals).toBeDefined();
    expect(typeof res.body.totals.totalUsers).toBe('number');
    expect(typeof res.body.totals.totalPosts).toBe('number');
    expect(res.body.chart).toHaveLength(7);
  });

  test('period=month -> chart 30 ngày', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .query({ period: 'month' })
      .set(auth(admin.token));
    expect(res.body.chart).toHaveLength(30);
  });

  test('member xem thống kê -> 403', async () => {
    const res = await request(app).get('/api/admin/stats').set(auth(member.token));
    expect(res.status).toBe(403);
  });
});
