const prisma = require('../config/prisma');
const fcmService = require('../services/fcm.service');
const { getIO } = require('../socket');

// pushNotification(n): boolean - đẩy thông báo tức thời (Socket.io + FCM)
function pushNotification(notification) {
  const { userId, content } = notification;
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }
  } catch (e) {
    // socket chưa khởi tạo (vd: chạy seed) -> bỏ qua
  }
  fcmService.sendPush(userId, 'BeacondFound', content).catch(() => {});
  return true;
}

// createNotification(n): boolean - tạo bản ghi thông báo rồi đẩy realtime
async function createNotification({ userId, type, content, targetUrl }) {
  const notification = await prisma.notification.create({
    data: { userId, type, content, targetUrl },
  });
  pushNotification(notification);
  return notification;
}

// GET /api/notifications
async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/:id/read
async function markAsRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}

// PUT /api/notifications/read-all
async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  pushNotification,
};
