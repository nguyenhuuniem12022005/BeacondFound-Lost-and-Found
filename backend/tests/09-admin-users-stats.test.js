/**
 * TEST CHỨC NĂNG: Quản lý người dùng (khóa/mở khóa) + Thống kê admin + Hồ sơ cá nhân
 */
const {
  app,
  request,
  prisma,
  auth,
  registerMember,
  createAdmin,
  createActivePost,
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

describe('Khóa / mở khóa tài khoản (admin)', () => {
  test('admin khóa member -> LOCKED, bài ACTIVE bị gỡ, không đăng nhập được', async () => {
    const victim = await registerMember();
    const activePost = await createActivePost(victim.token, admin.token, {
      title: 'Bài sẽ bị gỡ khi chủ bị khóa',
    });

    const res = await request(app)
      .put(`/api/users/${victim.user.id}/lock`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('LOCKED');

    // Bài ACTIVE của user vi phạm bị xóa vĩnh viễn
    const post = await prisma.post.findUnique({ where: { id: activePost.id } });
    expect(post).toBeNull();

    // Không đăng nhập được nữa
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: victim.email, password: victim.password });
    expect(login.status).toBe(403);
  });

  test('khóa lần nữa -> mở khóa (toggle), đăng nhập lại được', async () => {
    const victim = await registerMember();
    await request(app).put(`/api/users/${victim.user.id}/lock`).set(auth(admin.token));
    const res = await request(app)
      .put(`/api/users/${victim.user.id}/lock`)
      .set(auth(admin.token));
    expect(res.body.user.status).toBe('ACTIVE');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: victim.email, password: victim.password });
    expect(login.status).toBe(200);
  });

  test('không thể khóa tài khoản admin -> 400', async () => {
    const res = await request(app)
      .put(`/api/users/${admin.user.id}/lock`)
      .set(auth(admin.token));
    expect(res.status).toBe(400);
  });

  test('member không có quyền khóa -> 403', async () => {
    const res = await request(app)
      .put(`/api/users/${member.user.id}/lock`)
      .set(auth(member.token));
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/users: admin -> 200, member -> 403', async () => {
    const ok = await request(app).get('/api/admin/users').set(auth(admin.token));
    expect(ok.status).toBe(200);
    expect(ok.body.users.length).toBeGreaterThan(0);

    const denied = await request(app).get('/api/admin/users').set(auth(member.token));
    expect(denied.status).toBe(403);
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
