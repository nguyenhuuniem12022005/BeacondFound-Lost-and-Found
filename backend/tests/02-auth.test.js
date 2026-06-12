/**
 * TEST CHỨC NĂNG: Đăng ký / Đăng nhập / Xác thực (auth)
 */
const { app, request, prisma, uniqueEmail, auth, registerMember } = require('./helpers');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register - Đăng ký', () => {
  test('đăng ký thành công -> 201, trả token + user role MEMBER', async () => {
    const email = uniqueEmail('reg');
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Nguyễn Văn Test',
      email,
      password: '123456',
      phone: '0900000001',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('MEMBER');
    // Không bao giờ trả passwordHash ra ngoài
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('email đã tồn tại -> 409', async () => {
    const { email } = await registerMember();
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Người trùng email',
      email,
      password: '123456',
    });
    expect(res.status).toBe(409);
  });

  test('thiếu thông tin bắt buộc -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: uniqueEmail('x') });
    expect(res.status).toBe(400);
  });

  test('mật khẩu dưới 6 ký tự -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test',
      email: uniqueEmail('shortpw'),
      password: '123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login - Đăng nhập', () => {
  test('đăng nhập đúng -> 200, có token', async () => {
    const { email, password } = await registerMember();
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  test('sai mật khẩu -> 401', async () => {
    const { email } = await registerMember();
    const res = await request(app).post('/api/auth/login').send({ email, password: 'saimatkhau' });
    expect(res.status).toBe(401);
  });

  test('email không tồn tại -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'khongtontai@test.com', password: '123456' });
    expect(res.status).toBe(401);
  });

  test('thiếu email/mật khẩu -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  test('tài khoản bị khóa -> 403', async () => {
    const { user, email, password } = await registerMember();
    await prisma.user.update({ where: { id: user.id }, data: { status: 'LOCKED' } });
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me - Lấy thông tin bản thân', () => {
  test('có token hợp lệ -> 200, đúng user', async () => {
    const { token, email } = await registerMember();
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  test('không có token -> 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('token rác -> 401', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('token.khong.hople'));
    expect(res.status).toBe(401);
  });
});
