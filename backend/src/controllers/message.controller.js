const prisma = require('../config/prisma');
const socketController = require('./socket.controller');
const notificationController = require('./notification.controller');

const MESSAGE_SENDER = { sender: { select: { id: true, fullName: true, avatarUrl: true } } };

async function getChatRoomOrDeny(id, userId, res) {
  const chatRoom = await prisma.conversation.findUnique({ where: { id } });
  if (!chatRoom) {
    res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    return null;
  }
  if (chatRoom.memberOneId !== userId && chatRoom.memberTwoId !== userId) {
    res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    return null;
  }
  return chatRoom;
}

// GET /api/conversations/:id/messages  -> getMessages(c): Message[]
async function getMessages(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const chatRoom = await getChatRoomOrDeny(id, userId, res);
    if (!chatRoom) return;

    // Đánh dấu tin nhắn của đối phương là đã đọc
    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: MESSAGE_SENDER,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations/:id/messages  { content }  -> sendMessage(m): boolean
async function sendMessage(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung tin nhắn trống' });
    }
    const chatRoom = await getChatRoomOrDeny(id, userId, res);
    if (!chatRoom) return;

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: userId, content: content.trim() },
      include: MESSAGE_SENDER,
    });
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    const receiverId = chatRoom.memberOneId === userId ? chatRoom.memberTwoId : chatRoom.memberOneId;

    // Đẩy realtime qua SocketController
    socketController.pushMessage(message, receiverId);

    // Thông báo cho người nhận qua NotificationController
    await notificationController.createNotification({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      content: `${req.user.fullName} đã gửi cho bạn một tin nhắn mới.`,
      targetUrl: `/messages/${id}`,
    });

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, sendMessage };
