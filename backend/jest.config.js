/**
 * Cấu hình Jest cho bộ test backend BeacondFound.
 * Chạy: npm test
 */
module.exports = {
  testEnvironment: 'node',
  globalSetup: '<rootDir>/tests/global-setup.js',
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  // Các test dùng chung 1 database test -> chạy tuần tự để tránh xung đột
  maxWorkers: 1,
  verbose: true,
};
