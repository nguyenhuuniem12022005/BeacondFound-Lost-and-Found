/**
 * UNIT TEST: Hàm tính khoảng cách Haversine (geo.service)
 * Đây là unit test thuần túy, không cần database.
 */
const { haversineKm } = require('../src/services/geo.service');

describe('geo.service - haversineKm', () => {
  test('khoảng cách giữa 1 điểm với chính nó = 0', () => {
    expect(haversineKm(21.0285, 105.8542, 21.0285, 105.8542)).toBe(0);
  });

  test('Hà Nội -> TP.HCM khoảng 1130-1180 km', () => {
    const d = haversineKm(21.0285, 105.8542, 10.7769, 106.7009);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1200);
  });

  test('lệch 0.01 độ vĩ tuyến ~ 1.11 km', () => {
    const d = haversineKm(21.0, 105.85, 21.01, 105.85);
    expect(d).toBeCloseTo(1.11, 1);
  });

  test('khoảng cách có tính đối xứng: d(A,B) = d(B,A)', () => {
    const ab = haversineKm(21.03, 105.85, 10.78, 106.7);
    const ba = haversineKm(10.78, 106.7, 21.03, 105.85);
    expect(ab).toBeCloseTo(ba, 10);
  });
});
