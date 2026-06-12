const prisma = require('../config/prisma');
const notificationService = require('../services/notification.service');

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/users/profile
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: {
          where: { status: { not: 'DELETED' } },
          include: { images: true, category: true, postTags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id/lock (admin)
async function lockUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    if (target.role === 'ADMIN') {
      return res.status(400).json({ message: 'Không thể khóa tài khoản admin' });
    }
    const newStatus = target.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    const user = await prisma.user.update({ where: { id }, data: { status: newStatus } });

    if (newStatus === 'LOCKED') {
      // Gỡ các bài đang hoạt động của user vi phạm
      await prisma.post.updateMany({
        where: { userId: id, status: 'ACTIVE' },
        data: { status: 'DELETED' },
      });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users (admin)
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true, reportsReceived: true } } },
    });
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, lockUser, listUsers };
