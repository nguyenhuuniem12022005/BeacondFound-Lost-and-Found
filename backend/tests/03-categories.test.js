/**
 * TEST CHỨC NĂNG: Quản lý danh mục (chỉ admin được thêm/sửa/xóa)
 */
const { app, request, prisma, auth, registerMember, createAdmin } = require('./helpers');

let admin;
let member;

beforeAll(async () => {
  admin = await createAdmin();
  member = await registerMember();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function uniqueName(prefix = 'Danh mục test') {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

describe('GET /api/categories - Xem danh mục (công khai)', () => {
  test('guest xem được danh sách danh mục -> 200', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });
});

describe('POST /api/categories - Tạo danh mục', () => {
  test('guest tạo -> 401', async () => {
    const res = await request(app).post('/api/categories').send({ name: uniqueName() });
    expect(res.status).toBe(401);
  });

  test('member tạo -> 403 (không có quyền admin)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(auth(member.token))
      .send({ name: uniqueName() });
    expect(res.status).toBe(403);
  });

  test('admin tạo -> 201', async () => {
    const name = uniqueName();
    const res = await request(app)
      .post('/api/categories')
      .set(auth(admin.token))
      .send({ name, icon: '👜' });
    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe(name);
  });

  test('tên trùng -> 409', async () => {
    const name = uniqueName();
    await request(app).post('/api/categories').set(auth(admin.token)).send({ name });
    const res = await request(app).post('/api/categories').set(auth(admin.token)).send({ name });
    expect(res.status).toBe(409);
  });

  test('tên rỗng -> 400', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set(auth(admin.token))
      .send({ name: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('PUT & DELETE /api/categories/:id - Sửa / Xóa danh mục', () => {
  test('admin sửa tên danh mục -> 200', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set(auth(admin.token))
      .send({ name: uniqueName('Sửa') });
    const newName = uniqueName('Đã sửa');
    const res = await request(app)
      .put(`/api/categories/${created.body.category.id}`)
      .set(auth(admin.token))
      .send({ name: newName, icon: '🔑' });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe(newName);
    expect(res.body.category.icon).toBe('🔑');
  });

  test('admin xóa danh mục -> 200 và biến mất khỏi danh sách', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set(auth(admin.token))
      .send({ name: uniqueName('Xóa') });
    const id = created.body.category.id;

    const del = await request(app).delete(`/api/categories/${id}`).set(auth(admin.token));
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/categories');
    expect(list.body.categories.find((c) => c.id === id)).toBeUndefined();
  });

  test('member xóa -> 403', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set(auth(admin.token))
      .send({ name: uniqueName('Cấm xóa') });
    const res = await request(app)
      .delete(`/api/categories/${created.body.category.id}`)
      .set(auth(member.token));
    expect(res.status).toBe(403);
  });
});
