/**
 * TEST CHỨC NĂNG: Nhắn tin nội bộ (conversations + messages)
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
let finder; // người đăng bài (nhặt được đồ)
let loser; // người liên hệ (mất đồ)
let stranger; // người ngoài cuộc trò chuyện
let post;

beforeAll(async () => {
  admin = await createAdmin();
  finder = await registerMember();
  loser = await registerMember();
  stranger = await registerMember();
  post = await createActivePost(finder.token, admin.token, { title: 'Bài để test chat' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/conversations - Tạo cuộc trò chuyện', () => {
  test('tạo cuộc trò chuyện từ bài đăng -> 201, đúng partner', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set(auth(loser.token))
      .send({ postId: post.id });
    expect(res.status).toBe(201);
    expect(res.body.conversation.partner.id).toBe(finder.user.id);
  });

  test('tạo lại với cùng bài + cùng cặp người -> trả về phòng cũ (không tạo trùng)', async () => {
    const first = await request(app)
      .post('/api/conversations')
      .set(auth(loser.token))
      .send({ postId: post.id });
    const second = await request(app)
      .post('/api/conversations')
      .set(auth(loser.token))
      .send({ postId: post.id });
    expect(second.body.conversation.id).toBe(first.body.conversation.id);
  });

  test('nhắn tin với chính mình -> 400', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set(auth(finder.token))
      .send({ postId: post.id }); // finder là chủ bài
    expect(res.status).toBe(400);
  });

  test('thiếu người nhận -> 400', async () => {
    const res = await request(app).post('/api/conversations').set(auth(loser.token)).send({});
    expect(res.status).toBe(400);
  });

  test('bài không tồn tại -> 404', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set(auth(loser.token))
      .send({ postId: 99999999 });
    expect(res.status).toBe(404);
  });
});

describe('Gửi & nhận tin nhắn', () => {
  let conversationId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set(auth(loser.token))
      .send({ postId: post.id });
    conversationId = res.body.conversation.id;
  });

  test('gửi tin nhắn -> 201, người nhận có thông báo NEW_MESSAGE + unreadCount tăng', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set(auth(loser.token))
      .send({ content: 'Chào bạn, hình như đó là ví của tôi!' });
    expect(res.status).toBe(201);
    expect(res.body.message.content).toBe('Chào bạn, hình như đó là ví của tôi!');

    // Người nhận (finder) có notification
    const notif = await prisma.notification.findFirst({
      where: { userId: finder.user.id, type: 'NEW_MESSAGE' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notif).not.toBeNull();

    // Trong danh sách hội thoại của finder có unreadCount >= 1
    const list = await request(app).get('/api/conversations').set(auth(finder.token));
    const conv = list.body.conversations.find((c) => c.id === conversationId);
    expect(conv).toBeDefined();
    expect(conv.unreadCount).toBeGreaterThanOrEqual(1);
  });

  test('người nhận mở hội thoại đọc tin -> tin được đánh dấu đã đọc', async () => {
    const msgs = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set(auth(finder.token));
    expect(msgs.status).toBe(200);
    expect(msgs.body.messages.length).toBeGreaterThan(0);

    const list = await request(app).get('/api/conversations').set(auth(finder.token));
    const conv = list.body.conversations.find((c) => c.id === conversationId);
    expect(conv.unreadCount).toBe(0);
  });

  test('tin nhắn rỗng -> 400', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set(auth(loser.token))
      .send({ content: '   ' });
    expect(res.status).toBe(400);
  });

  test('người ngoài đọc hội thoại -> 403', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set(auth(stranger.token));
    expect(res.status).toBe(403);
  });

  test('người ngoài gửi tin vào hội thoại -> 403', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set(auth(stranger.token))
      .send({ content: 'Tôi chen vào được không?' });
    expect(res.status).toBe(403);
  });

  test('guest truy cập hội thoại -> 401', async () => {
    const res = await request(app).get(`/api/conversations/${conversationId}/messages`);
    expect(res.status).toBe(401);
  });
});
