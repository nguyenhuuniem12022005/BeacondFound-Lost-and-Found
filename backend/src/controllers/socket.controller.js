const { getIO } = require('../socket');

/**
 * SocketController: đẩy tin nhắn realtime tới các client đang online.
 * pushMessage(m): boolean
 */
function pushMessage(message, receiverId) {
  const io = getIO();
  if (!io) return false;
  io.to(`conversation:${message.conversationId}`).emit('message:new', message);
  if (receiverId) {
    io.to(`user:${receiverId}`).emit('conversation:updated', {
      conversationId: message.conversationId,
      message,
    });
  }
  return true;
}

module.exports = { pushMessage };
