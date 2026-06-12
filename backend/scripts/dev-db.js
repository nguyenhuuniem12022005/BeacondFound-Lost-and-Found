/**
 * Khởi động PostgreSQL portable cho môi trường dev khi máy chưa cài PostgreSQL.
 * Binaries lấy từ package @embedded-postgres/windows-x64 và được copy sang
 * đường dẫn ASCII (PostgreSQL không chạy được từ đường dẫn có dấu tiếng Việt).
 *
 * Production: dùng PostgreSQL thật và đổi DATABASE_URL trong .env.
 */
const path = require('path');
const fs = require('fs');
const { spawnSync, spawn } = require('child_process');

const PG_HOME = process.env.PG_HOME || 'D:\\beacondfound-pg';
const BIN_DIR = path.join(PG_HOME, 'bin');
const DATA_DIR = process.env.PG_DATA_DIR || path.join(PG_HOME, 'data');
const PORT = process.env.PG_PORT || '5433';
const SOURCE_NATIVE = path.join(
  __dirname,
  '..',
  'node_modules',
  '@embedded-postgres',
  'windows-x64',
  'native'
);

function copyBinaries() {
  if (fs.existsSync(BIN_DIR)) return;
  if (!fs.existsSync(SOURCE_NATIVE)) {
    console.error('[dev-db] Không tìm thấy binaries. Hãy chạy "npm install" trước.');
    process.exit(1);
  }
  console.log(`[dev-db] Copy PostgreSQL binaries -> ${PG_HOME} ...`);
  // Dùng robocopy trên Windows (fs.cpSync có thể crash với symlink trong package)
  spawnSync('robocopy', [SOURCE_NATIVE, PG_HOME, '/E', '/NFL', '/NDL', '/NJH'], {
    stdio: 'ignore',
    shell: true,
  });
}

function initCluster() {
  if (fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'))) return;
  console.log('[dev-db] Khởi tạo cluster PostgreSQL...');
  const res = spawnSync(
    path.join(BIN_DIR, 'initdb.exe'),
    ['-D', DATA_DIR, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8'],
    { stdio: 'inherit' }
  );
  if (res.status !== 0) {
    console.error('[dev-db] initdb thất bại');
    process.exit(1);
  }
}

function startServer() {
  console.log('[dev-db] Đang khởi động PostgreSQL...');
  const proc = spawn(
    path.join(BIN_DIR, 'postgres.exe'),
    ['-D', DATA_DIR, '-p', PORT],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  proc.stdout.on('data', (d) => process.stdout.write(`[pg] ${d}`));
  proc.stderr.on('data', (d) => {
    const text = d.toString();
    process.stderr.write(`[pg] ${text}`);
    if (text.includes('ready to accept connections')) {
      onReady();
    }
  });
  proc.on('exit', (code) => {
    console.log(`[dev-db] PostgreSQL đã dừng (code ${code})`);
    process.exit(code || 0);
  });

  const stop = () => {
    spawnSync(path.join(BIN_DIR, 'pg_ctl.exe'), ['stop', '-D', DATA_DIR, '-m', 'fast'], {
      stdio: 'ignore',
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

function onReady() {
  // Tạo database beacondfound nếu chưa có
  const check = spawnSync(
    path.join(BIN_DIR, 'psql.exe'),
    ['-U', 'postgres', '-p', PORT, '-tAc', "SELECT 1 FROM pg_database WHERE datname='beacondfound'"],
    { encoding: 'utf8' }
  );
  if (!check.stdout || !check.stdout.includes('1')) {
    spawnSync(path.join(BIN_DIR, 'createdb.exe'), ['-U', 'postgres', '-p', PORT, 'beacondfound'], {
      stdio: 'inherit',
    });
    console.log('[dev-db] Đã tạo database "beacondfound"');
  }
  console.log(
    `[dev-db] PostgreSQL is running at postgresql://postgres:postgres@localhost:${PORT}/beacondfound`
  );
  console.log('[dev-db] Nhấn Ctrl+C để dừng.');
}

copyBinaries();
initCluster();
startServer();
