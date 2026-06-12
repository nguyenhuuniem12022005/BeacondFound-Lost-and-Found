/**
 * Global setup - chạy 1 lần trước toàn bộ test:
 * 1. Tạo database test (beacondfound_test) + đồng bộ schema bằng `prisma db push`.
 * 2. Xóa sạch dữ liệu cũ để mỗi lần chạy test đều bắt đầu từ trạng thái sạch.
 *
 * Yêu cầu: PostgreSQL dev đang chạy (npm run db:dev).
 */
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/beacondfound_test?schema=public';

module.exports = async () => {
  // 1. Tạo DB test nếu chưa có + đồng bộ schema
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });

  // 2. Dọn sạch dữ liệu
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
  });
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Report", "Notification", "Message", "Conversation",
        "PostTag", "Tag", "PostImage", "Post", "Category", "User"
      RESTART IDENTITY CASCADE
    `);
  } finally {
    await prisma.$disconnect();
  }
};
