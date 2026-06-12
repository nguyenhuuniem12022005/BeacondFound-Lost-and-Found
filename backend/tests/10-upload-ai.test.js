/**
 * TEST CHỨC NĂNG: Upload ảnh (mock Cloudinary) + AI gợi ý tags (mock Google Vision)
 */
const { app, request, prisma, auth, registerMember } = require('./helpers');

let member;

beforeAll(async () => {
  member = await registerMember();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/ai/suggest-tags - AI gợi ý tags', () => {
  test('tên file chứa "vi" (ví) -> gợi ý tag "ví da"', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set(auth(member.token))
      .send({ filenames: ['vi-da-den.jpg'] });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toContain('ví da');
  });

  test('tên file chứa "phone" -> gợi ý tag "điện thoại"', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set(auth(member.token))
      .send({ filenames: ['iphone-15-pro.png'] });
    expect(res.status).toBe(200);
    expect(res.body.tags).toContain('điện thoại');
  });

  test('tên file không khớp từ khóa nào -> trả tags mặc định', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set(auth(member.token))
      .send({ filenames: ['zzz-unknown-9999.jpg'] });
    expect(res.status).toBe(200);
    expect(res.body.tags.length).toBeGreaterThan(0);
    expect(res.body.tags).toContain('đồ vật');
  });

  test('guest -> 401', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .send({ filenames: ['vi.jpg'] });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/upload/images - Upload ảnh', () => {
  // PNG 1x1 pixel hợp lệ (nhỏ nhất có thể) để test upload
  const TINY_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  test('upload 1 ảnh -> 201, trả về mảng url', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .set(auth(member.token))
      .attach('images', TINY_PNG, 'test-image.png');
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.urls)).toBe(true);
    expect(res.body.urls).toHaveLength(1);
    expect(typeof res.body.urls[0]).toBe('string');
  });

  test('không gửi ảnh nào -> 400', async () => {
    const res = await request(app).post('/api/upload/images').set(auth(member.token));
    expect(res.status).toBe(400);
  });

  test('guest upload -> 401', async () => {
    const res = await request(app)
      .post('/api/upload/images')
      .attach('images', TINY_PNG, 'test-image.png');
    expect(res.status).toBe(401);
  });
});
