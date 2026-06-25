const prisma = require('../config/prisma');

const CHATROOM_INCLUDE = {
  post: { select: { id: true, title: true, type: true, status: true, images: { take: 1 } } },
  memberOne: { select: { id: true, fullName: true, avatarUrl: true } },
  memberTwo: { select: { id: true, fullName: true, avatarUrl: true } },
  messages: { orderBy: { createdAt: 'desc' }, take: 1 },
};

function withPartner(chatRoom, userId) {
  return {
    ...chatRoom,
    partner: chatRoom.memberOneId === userId ? chatRoom.memberTwo : chatRoom.memberOne,
  };
}

// GET /api/conversations  -> getChatRooms(u): ChatRoom[]
async function getChatRooms(req, res, next) {
  try {
    const userId = req.user.id;
    const chatRooms = await prisma.conversation.findMany({
      where: { OR: [{ memberOneId: userId }, { memberTwoId: userId }] },
      include: {
        ...CHATROOM_INCLUDE,
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: userId } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({
      conversations: chatRooms.map((c) => ({
        ...withPartner(c, userId),
        lastMessage: c.messages[0] || null,
        unreadCount: c._count.messages,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/conversations/:id  -> getChatRoomById
async function getChatRoomById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const chatRoom = await prisma.conversation.findUnique({
      where: { id },
      include: CHATROOM_INCLUDE,
    });
    if (!chatRoom) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (chatRoom.memberOneId !== userId && chatRoom.memberTwoId !== userId) {
      return res.status(403).json({ message: 'Bạn không thuộc cuộc trò chuyện này' });
    }
    res.json({ conversation: withPartner(chatRoom, userId) });
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations  { postId, partnerId? }  -> findOrCreateChatRoom(sender, receiver, p): ChatRoom
async function findOrCreateChatRoom(req, res, next) {
  try {
    const userId = req.user.id;
    const { postId, partnerId } = req.body;

    let targetUserId = partnerId ? Number(partnerId) : null;
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
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
    let chatRoom = await prisma.conversation.findFirst({
      where: {
        postId: postId ? Number(postId) : undefined,
        OR: [
          { memberOneId: userId, memberTwoId: targetUserId },
          { memberOneId: targetUserId, memberTwoId: userId },
        ],
      },
      include: CHATROOM_INCLUDE,
    });

    if (!chatRoom) {
      chatRoom = await prisma.conversation.create({
        data: {
          postId: postId ? Number(postId) : null,
          memberOneId: userId,
          memberTwoId: targetUserId,
        },
        include: CHATROOM_INCLUDE,
      });
    }
    res.status(201).json({ conversation: withPartner(chatRoom, userId) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  CHATROOM_INCLUDE,
  getChatRooms,
  getChatRoomById,
  findOrCreateChatRoom,
};
