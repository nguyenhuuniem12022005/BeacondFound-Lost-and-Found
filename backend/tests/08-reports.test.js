/**
 * TEST CHỨC NĂNG: Báo cáo vi phạm (reports)
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
let reporter; // người báo cáo
let badUser; // người bị báo cáo
let post;

beforeAll(async () => {
  admin = await createAdmin();
  reporter = await registerMember();
  badUser = await registerMember();
  post = await createActivePost(badUser.token, admin.token, { title: 'Bài nghi lừa đảo (test)' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/reports - Gửi báo cáo', () => {
  test('member báo cáo bài đăng -> 201, trạng thái PENDING', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ postId: post.id, reason: 'Bài đăng có dấu hiệu lừa đảo phí vận chuyển' });
    expect(res.status).toBe(201);
    expect(res.body.report.status).toBe('PENDING');
    expect(res.body.report.reporter.id).toBe(reporter.user.id);
  });

  test('member báo cáo người dùng -> 201', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ reportedUserId: badUser.user.id, reason: 'Tài khoản spam tin nhắn' });
    expect(res.status).toBe(201);
    expect(res.body.report.reportedUser.id).toBe(badUser.user.id);
  });

  test('thiếu lý do -> 400', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ postId: post.id });
    expect(res.status).toBe(400);
  });

  test('thiếu đối tượng bị báo cáo -> 400', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ reason: 'Báo cáo không rõ ai' });
    expect(res.status).toBe(400);
  });

  test('guest gửi báo cáo -> 401', async () => {
    const res = await request(app).post('/api/reports').send({ postId: post.id, reason: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Admin xử lý báo cáo', () => {
  let reportId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ postId: post.id, reason: 'Báo cáo để admin xử lý (test)' });
    reportId = res.body.report.id;
  });

  test('member xem danh sách báo cáo -> 403', async () => {
    const res = await request(app).get('/api/admin/reports').set(auth(reporter.token));
    expect(res.status).toBe(403);
  });

  test('admin xem danh sách -> 200, có báo cáo vừa tạo', async () => {
    const res = await request(app).get('/api/admin/reports').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.reports.find((r) => r.id === reportId)).toBeDefined();
  });

  test('admin xem chi tiết -> 200', async () => {
    const res = await request(app).get(`/api/admin/reports/${reportId}`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.report.id).toBe(reportId);
  });

  test('admin resolve -> RESOLVED + người báo cáo nhận thông báo', async () => {
    const res = await request(app)
      .put(`/api/admin/reports/${reportId}/resolve`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('RESOLVED');

    const notif = await prisma.notification.findFirst({
      where: { userId: reporter.user.id, type: 'REPORT_RESOLVED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();
  });

  test('admin reject báo cáo khác -> REJECTED + thông báo', async () => {
    const created = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ postId: post.id, reason: 'Báo cáo sẽ bị từ chối (test)' });

    const res = await request(app)
      .put(`/api/admin/reports/${created.body.report.id}/reject`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.report.status).toBe('REJECTED');

    const notif = await prisma.notification.findFirst({
      where: { userId: reporter.user.id, type: 'REPORT_REJECTED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();
  });

  test('admin khóa tài khoản từ báo cáo -> LOCKED, xóa bài ACTIVE và resolve báo cáo', async () => {
    const violator = await registerMember();
    const activePost = await createActivePost(violator.token, admin.token, {
      title: 'Bài vi phạm dẫn đến khóa tài khoản',
    });
    const created = await request(app)
      .post('/api/reports')
      .set(auth(reporter.token))
      .send({ postId: activePost.id, reason: 'Tài khoản có hành vi vi phạm nghiêm trọng' });

    const res = await request(app)
      .put(`/api/admin/reports/${created.body.report.id}/lock-user`)
      .set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe('LOCKED');
    expect(res.body.report.status).toBe('RESOLVED');
    expect(await prisma.post.findUnique({ where: { id: activePost.id } })).toBeNull();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: violator.email, password: violator.password });
    expect(login.status).toBe(403);
  });

  test('lọc theo trạng thái PENDING -> không chứa báo cáo đã xử lý', async () => {
    const res = await request(app)
      .get('/api/admin/reports')
      .query({ status: 'PENDING' })
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.reports.every((r) => r.status === 'PENDING')).toBe(true);
  });
});
