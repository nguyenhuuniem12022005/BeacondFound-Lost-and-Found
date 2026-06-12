/**
 * TEST CHỨC NĂNG: Thông báo (notifications)
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
let otherMember;

beforeAll(async () => {
  admin = await createAdmin();
  member = await registerMember();
  otherMember = await registerMember();
  // Admin duyệt bài -> tự sinh notification POST_APPROVED cho member
  await createActivePost(member.token, admin.token, { title: 'Bài test thông báo' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/notifications', () => {
  test('member nhận được thông báo khi bài được duyệt, unreadCount >= 1', async () => {
    const res = await request(app).get('/api/notifications').set(auth(member.token));
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(res.body.notifications.some((n) => n.type === 'POST_APPROVED')).toBe(true);
  });

  test('guest -> 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('Đánh dấu đã đọc', () => {
  test('đánh dấu 1 thông báo -> isRead = true', async () => {
    const list = await request(app).get('/api/notifications').set(auth(member.token));
    const unread = list.body.notifications.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    const res = await request(app)
      .put(`/api/notifications/${unread.id}/read`)
      .set(auth(member.token));
    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  test('không thể đánh dấu thông báo của người khác -> 404', async () => {
    const list = await request(app).get('/api/notifications').set(auth(member.token));
    const someNotif = list.body.notifications[0];

    const res = await request(app)
      .put(`/api/notifications/${someNotif.id}/read`)
      .set(auth(otherMember.token));
    expect(res.status).toBe(404);
  });

  test('đánh dấu tất cả đã đọc -> unreadCount = 0', async () => {
    const res = await request(app)
      .put('/api/notifications/read-all')
      .set(auth(member.token));
    expect(res.status).toBe(200);

    const list = await request(app).get('/api/notifications').set(auth(member.token));
    expect(list.body.unreadCount).toBe(0);
  });
});
