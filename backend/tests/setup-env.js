/**
 * Thiết lập biến môi trường TRƯỚC khi mỗi file test được nạp.
 * Quan trọng: trỏ DATABASE_URL sang database test riêng (beacondfound_test)
 * để test không làm hỏng dữ liệu development.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/beacondfound_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
