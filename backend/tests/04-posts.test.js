/**
 * TEST CHỨC NĂNG: Bài đăng - tạo / duyệt / sửa / xóa / resolve
 * Kiểm tra toàn bộ vòng đời: PENDING -> ACTIVE -> RESOLVED / REJECTED / DELETED
 */
const {
  app,
  request,
  prisma,
  auth,
  registerMember,
  createAdmin,
  samplePost,
  createPost,
  createActivePost,
} = require('./helpers');

let admin;
let owner; // chủ bài đăng
let other; // thành viên khác

beforeAll(async () => {
  admin = await createAdmin();
  owner = await registerMember();
  other = await registerMember();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/posts - Tạo bài đăng', () => {
  test('member tạo bài hợp lệ -> 201, trạng thái mặc định PENDING, có tags', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(auth(owner.token))
      .send(samplePost({ tags: ['ví da', 'màu đen'] }));
    expect(res.status).toBe(201);
    expect(res.body.post.status).toBe('PENDING');
    const tagNames = res.body.post.tags.map((t) => t.name);
    expect(tagNames).toContain('ví da');
    expect(tagNames).toContain('màu đen');
  });

  test('guest tạo bài -> 401', async () => {
    const res = await request(app).post('/api/posts').send(samplePost());
    expect(res.status).toBe(401);
  });

  test('thiếu thông tin bắt buộc -> 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(auth(owner.token))
      .send({ title: 'Chỉ có tiêu đề' });
    expect(res.status).toBe(400);
  });

  test('loại bài không hợp lệ -> 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(auth(owner.token))
      .send(samplePost({ type: 'KHONG_HOP_LE' }));
    expect(res.status).toBe(400);
  });

  test('quá 3 ảnh -> 400', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(auth(owner.token))
      .send(samplePost({ images: ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg'] }));
    expect(res.status).toBe(400);
  });
});

describe('Quy trình duyệt bài (moderation)', () => {
  test('bài PENDING không xuất hiện ở feed công khai', async () => {
    const post = await createPost(owner.token);
    const feed = await request(app).get('/api/posts');
    expect(feed.status).toBe(200);
    expect(feed.body.posts.find((p) => p.id === post.id)).toBeUndefined();
  });

  test('guest xem chi tiết bài PENDING -> 403', async () => {
    const post = await createPost(owner.token);
    const res = await request(app).get(`/api/posts/${post.id}`);
    expect(res.status).toBe(403);
  });

  test('chủ bài xem được bài PENDING của mình -> 200', async () => {
    const post = await createPost(owner.token);
    const res = await request(app).get(`/api/posts/${post.id}`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.post.id).toBe(post.id);
  });

  test('member thường không được duyệt bài -> 403', async () => {
    const post = await createPost(owner.token);
    const res = await request(app)
      .put(`/api/admin/posts/${post.id}/approve`)
      .set(auth(other.token));
    expect(res.status).toBe(403);
  });

  test('admin duyệt bài -> ACTIVE, xuất hiện ở feed, chủ bài nhận thông báo', async () => {
    const post = await createPost(owner.token);
    const res = await request(app)
      .put(`/api/admin/posts/${post.id}/approve`)
      .set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.post.status).toBe('ACTIVE');

    const feed = await request(app).get('/api/posts');
    expect(feed.body.posts.find((p) => p.id === post.id)).toBeDefined();

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.user.id, type: 'POST_APPROVED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();
    expect(notif.content).toContain(post.title);
  });

  test('admin từ chối bài -> REJECTED + thông báo kèm lý do', async () => {
    const post = await createPost(owner.token);
    const res = await request(app)
      .put(`/api/admin/posts/${post.id}/reject`)
      .set(auth(admin.token))
      .send({ reason: 'Thiếu thông tin liên hệ' });
    expect(res.status).toBe(200);
    expect(res.body.post.status).toBe('REJECTED');

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.user.id, type: 'POST_REJECTED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();
    expect(notif.content).toContain('Thiếu thông tin liên hệ');
  });

  test('danh sách chờ duyệt của admin chứa bài PENDING', async () => {
    const post = await createPost(owner.token);
    const res = await request(app).get('/api/admin/posts/pending').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.posts.find((p) => p.id === post.id)).toBeDefined();
  });
});

describe('PUT /api/posts/:id - Sửa bài đăng', () => {
  test('người khác sửa bài -> 403', async () => {
    const post = await createPost(owner.token);
    const res = await request(app)
      .put(`/api/posts/${post.id}`)
      .set(auth(other.token))
      .send({ title: 'Hack tiêu đề' });
    expect(res.status).toBe(403);
  });

  test('chủ bài sửa bài ACTIVE -> quay về PENDING chờ duyệt lại', async () => {
    const post = await createActivePost(owner.token, admin.token);
    const res = await request(app)
      .put(`/api/posts/${post.id}`)
      .set(auth(owner.token))
      .send({ title: 'Tiêu đề mới sau khi sửa' });
    expect(res.status).toBe(200);
    expect(res.body.post.title).toBe('Tiêu đề mới sau khi sửa');
    expect(res.body.post.status).toBe('PENDING');
  });
});

describe('Resolve & Delete bài đăng', () => {
  test('chủ bài đánh dấu đã tìm thấy -> RESOLVED', async () => {
    const post = await createActivePost(owner.token, admin.token);
    const res = await request(app)
      .put(`/api/posts/${post.id}/resolve`)
      .set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.post.status).toBe('RESOLVED');
  });

  test('người khác resolve bài -> 403', async () => {
    const post = await createActivePost(owner.token, admin.token);
    const res = await request(app)
      .put(`/api/posts/${post.id}/resolve`)
      .set(auth(other.token));
    expect(res.status).toBe(403);
  });

  test('chủ bài xóa bài -> biến mất khỏi feed, xem chi tiết -> 404', async () => {
    const post = await createActivePost(owner.token, admin.token);
    const del = await request(app).delete(`/api/posts/${post.id}`).set(auth(owner.token));
    expect(del.status).toBe(200);

    const feed = await request(app).get('/api/posts');
    expect(feed.body.posts.find((p) => p.id === post.id)).toBeUndefined();

    const detail = await request(app).get(`/api/posts/${post.id}`).set(auth(owner.token));
    expect(detail.status).toBe(404);
  });

  test('admin xóa bài của người khác -> chủ bài nhận thông báo POST_DELETED', async () => {
    const post = await createActivePost(owner.token, admin.token);
    const res = await request(app).delete(`/api/posts/${post.id}`).set(auth(admin.token));
    expect(res.status).toBe(200);

    const notif = await prisma.notification.findFirst({
      where: { userId: owner.user.id, type: 'POST_DELETED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();
  });

  test('GET /api/posts/my chỉ trả bài của chính mình', async () => {
    const mine = await createPost(owner.token);
    const res = await request(app).get('/api/posts/my').set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.posts.find((p) => p.id === mine.id)).toBeDefined();
    expect(res.body.posts.every((p) => p.userId === owner.user.id)).toBe(true);
  });
});
