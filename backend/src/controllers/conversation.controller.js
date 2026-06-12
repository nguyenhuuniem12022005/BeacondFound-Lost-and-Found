const prisma = require('../config/prisma');
const notificationService = require('../services/notification.service');
const { getIO } = require('../socket');

const CONV_INCLUDE = {
  post: { select: { id: true, title: true, type: true, status: true, images: { take: 1 } } },
  memberOne: { select: { id: true, fullName: true, avatarUrl: true } },
  memberTwo: { select: { id: true, fullName: true, avatarUrl: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
};

// GET /api/conversations
async function getConversations(req, res, next) {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ memberOneId: userId }, { memberTwoId: userId }] },
      include: {
        ...CONV_INCLUDE,
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: userId } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({
      conversations: conversations.map((c) => ({
        ...c,
        partner: c.memberOneId === userId ? c.memberTwo : c.memberOne,
        lastMessage: c.messages[0] || null,
        unreadCount: c._count.messages,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/conversations/:id
async function getConversationById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: CONV_INCLUDE,
    });
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (conversation.memberOneId !== userId && conversation.memberTwoId !== userId) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    }
    res.json({
      conversation: {
        ...conversation,
        partner: conversation.memberOneId === userId ? conversation.memberTwo : conversation.memberOne,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations  { postId, partnerId? }
async function createConversation(req, res, next) {
  try {
    const userId = req.user.id;
    const { postId, partnerId } = req.body;

    let targetUserId = partnerId ? Number(partnerId) : null;
    let post = null;
    if (postId) {
      post = await prisma.post.findUnique({ where: { id: Number(postId) } });
      if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
      targetUserId = targetUserId || post.userId;
    }
    if (!targetUserId) {
      return res.status(400).json({ message: 'Thiếu thông tin người nhận' });
    }
    if (targetUserId === userId) {
      return res.status(400).json({ message: 'Không thể nhắn tin với chính mình' });
    }

    // Nếu phòng chat đã tồn tại (cùng cặp người + cùng bài) thì mở phòng cũ
    let conversation = await prisma.conversation.findFirst({
      where: {
        postId: postId ? Number(postId) : undefined,
        OR: [
          { memberOneId: userId, memberTwoId: targetUserId },
          { memberOneId: targetUserId, memberTwoId: userId },
        ],
      },
      include: CONV_INCLUDE,
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          postId: postId ? Number(postId) : null,
          memberOneId: userId,
          memberTwoId: targetUserId,
        },
        include: CONV_INCLUDE,
      });
    }
    res.status(201).json({
      conversation: {
        ...conversation,
        partner: conversation.memberOneId === userId ? conversation.memberTwo : conversation.memberOne,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/conversations/:id/messages
async function getMessages(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (conversation.memberOneId !== userId && conversation.memberTwoId !== userId) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    }
    // Đánh dấu tin nhắn của đối phương là đã đọc
    await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations/:id/messages  { content }
async function sendMessage(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung tin nhắn trống' });
    }
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (conversation.memberOneId !== userId && conversation.memberTwoId !== userId) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    }
    const message = await prisma.message.create({
      data: { conversationId: id, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    const receiverId = conversation.memberOneId === userId ? conversation.memberTwoId : conversation.memberOneId;

    // Realtime qua Socket.io
    const io = getIO();
    if (io) {
      io.to(`conversation:${id}`).emit('message:new', message);
      io.to(`user:${receiverId}`).emit('conversation:updated', { conversationId: id, message });
    }

    // Notification cho người nhận
    await notificationService.createNotification({
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

module.exports = {
  getConversations,
  getConversationById,
  createConversation,
  getMessages,
  sendMessage,
};
