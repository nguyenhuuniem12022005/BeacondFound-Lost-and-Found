const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/** Middleware kiểm tra đăng nhập bằng JWT */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Chưa đăng nhập' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }
    if (user.status === 'LOCKED') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/** Middleware kiểm tra quyền admin */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
