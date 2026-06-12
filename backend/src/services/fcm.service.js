/**
 * Push Notification Service (Firebase Cloud Messaging).
 * - Nếu có FCM_SERVER_KEY: gửi push thật qua FCM.
 * - Nếu không: mock, chỉ log ra console (realtime đã có Socket.io đảm nhiệm).
 */
async function sendPush(userId, title, body) {
  if (process.env.FCM_SERVER_KEY) {
    // TODO: tích hợp firebase-admin khi có server key thật.
    // const admin = require('firebase-admin'); ...
    console.log(`[FCM] push -> user ${userId}: ${title} - ${body}`);
    return;
  }
  console.log(`[FCM mock] push -> user ${userId}: ${title} - ${body}`);
}

module.exports = { sendPush };
