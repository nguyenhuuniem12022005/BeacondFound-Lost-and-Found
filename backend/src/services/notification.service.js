const prisma = require('../config/prisma');
const fcmService = require('./fcm.service');
const { getIO } = require('../socket');

/**
 * Tạo notification trong DB, đẩy realtime qua Socket.io và push qua FCM (mock).
 */
function dispatchNotification(notification) {
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
}

async function createNotification({ userId, type, content, targetUrl }) {
  const notification = await prisma.notification.create({
    data: { userId, type, content, targetUrl },
  });

  dispatchNotification(notification);
  return notification;
}

module.exports = { createNotification, dispatchNotification };
