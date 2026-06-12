/**
 * TEST CHỨC NĂNG: Tìm kiếm bài đăng (từ khóa, bộ lọc, bản đồ + bán kính)
 */
const {
  app,
  request,
  prisma,
  registerMember,
  createAdmin,
  createPost,
  createActivePost,
} = require('./helpers');

let admin;
let member;
const UNIQUE_KEY = `vidatest${Date.now()}`; // từ khóa duy nhất tránh đụng dữ liệu khác

// Tọa độ test: Hồ Gươm và 1 điểm rất xa (TP.HCM)
const HANOI = { latitude: 21.0285, longitude: 105.8542 };
const HCMC = { latitude: 10.7769, longitude: 106.7009 };

let postNear; // ACTIVE tại Hà Nội
let postFar; // ACTIVE tại TP.HCM
let postPending; // PENDING - không được xuất hiện khi tìm kiếm

beforeAll(async () => {
  admin = await createAdmin();
  member = await registerMember();

  postNear = await createActivePost(member.token, admin.token, {
    title: `Nhặt được ${UNIQUE_KEY} gần Hồ Gươm`,
    type: 'FOUND',
    tags: [UNIQUE_KEY],
    ...HANOI,
  });
  postFar = await createActivePost(member.token, admin.token, {
    title: `Mất ${UNIQUE_KEY} ở Sài Gòn`,
    type: 'LOST',
    tags: [UNIQUE_KEY],
    ...HCMC,
  });
  postPending = await createPost(member.token, {
    title: `Bài chưa duyệt ${UNIQUE_KEY}`,
    ...HANOI,
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/search/posts - Tìm theo từ khóa & bộ lọc', () => {
  test('tìm theo từ khóa -> chỉ trả bài ACTIVE khớp', async () => {
    const res = await request(app).get('/api/search/posts').query({ keyword: UNIQUE_KEY });
    expect(res.status).toBe(200);
    const ids = res.body.posts.map((p) => p.id);
    expect(ids).toContain(postNear.id);
    expect(ids).toContain(postFar.id);
    // Bài PENDING tuyệt đối không xuất hiện
    expect(ids).not.toContain(postPending.id);
  });

  test('lọc theo loại LOST -> chỉ trả bài mất đồ', async () => {
    const res = await request(app)
      .get('/api/search/posts')
      .query({ keyword: UNIQUE_KEY, type: 'LOST' });
    expect(res.status).toBe(200);
    const ids = res.body.posts.map((p) => p.id);
    expect(ids).toContain(postFar.id);
    expect(ids).not.toContain(postNear.id);
  });

  test('tìm theo tag -> trả đúng bài gắn tag', async () => {
    const res = await request(app).get('/api/search/posts').query({ tag: UNIQUE_KEY });
    expect(res.status).toBe(200);
    const ids = res.body.posts.map((p) => p.id);
    expect(ids).toContain(postNear.id);
    expect(ids).toContain(postFar.id);
  });

  test('từ khóa vô nghĩa -> danh sách rỗng', async () => {
    const res = await request(app)
      .get('/api/search/posts')
      .query({ keyword: 'tukhoa-khong-ton-tai-xyz-999' });
    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(0);
  });
});

describe('GET /api/search/map - Tìm quanh vị trí (Haversine)', () => {
  test('tâm Hồ Gươm bán kính 5km -> thấy bài gần, không thấy bài TP.HCM', async () => {
    const res = await request(app)
      .get('/api/search/map')
      .query({ lat: HANOI.latitude, lng: HANOI.longitude, radius: 5 });
    expect(res.status).toBe(200);
    const ids = res.body.posts.map((p) => p.id);
    expect(ids).toContain(postNear.id);
    expect(ids).not.toContain(postFar.id);
  });

  test('mỗi kết quả có distanceKm và được sắp xếp tăng dần', async () => {
    const res = await request(app)
      .get('/api/search/map')
      .query({ lat: HANOI.latitude, lng: HANOI.longitude, radius: 50 });
    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBeGreaterThan(0);
    const distances = res.body.posts.map((p) => p.distanceKm);
    distances.forEach((d) => expect(typeof d).toBe('number'));
    const sorted = [...distances].sort((a, b) => a - b);
    expect(distances).toEqual(sorted);
  });

  test('bán kính cực lớn (2000km) -> thấy cả bài TP.HCM kèm khoảng cách ~1140km', async () => {
    const res = await request(app)
      .get('/api/search/map')
      .query({ lat: HANOI.latitude, lng: HANOI.longitude, radius: 2000 });
    const far = res.body.posts.find((p) => p.id === postFar.id);
    expect(far).toBeDefined();
    expect(far.distanceKm).toBeGreaterThan(1000);
    expect(far.distanceKm).toBeLessThan(1300);
  });

  test('thiếu tọa độ -> 400', async () => {
    const res = await request(app).get('/api/search/map').query({ radius: 5 });
    expect(res.status).toBe(400);
  });
});
