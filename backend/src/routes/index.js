const express = require('express');
const multer = require('multer');

const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const categoryController = require('../controllers/category.controller');
const postController = require('../controllers/post.controller');
const searchController = require('../controllers/search.controller');
const conversationController = require('../controllers/conversation.controller');
const notificationController = require('../controllers/notification.controller');
const reportController = require('../controllers/report.controller');
const statsController = require('../controllers/stats.controller');
const uploadController = require('../controllers/upload.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 3 },
});

/** Middleware: gắn req.user nếu có token (không bắt buộc) */
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await prisma.user.findUnique({ where: { id: payload.id } });
    }
  } catch (e) {
    // token sai -> coi như guest
  }
  next();
}

// ===== Auth =====
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);

// ===== Users =====
router.get('/users/profile', authenticate, userController.getProfile);
router.put('/users/profile', authenticate, userController.updateProfile);

// ===== Categories =====
router.get('/categories', categoryController.getCategories);
router.post('/categories', authenticate, requireAdmin, categoryController.createCategory);
router.put('/categories/:id', authenticate, requireAdmin, categoryController.updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, categoryController.deleteCategory);

// ===== Posts =====
router.get('/posts', postController.getPosts);
router.get('/posts/my', authenticate, postController.getMyPosts);
router.get('/posts/:id', optionalAuth, postController.getPostById);
router.post('/posts', authenticate, postController.createPost);
router.put('/posts/:id', authenticate, postController.updatePost);
router.delete('/posts/:id', authenticate, postController.deletePost);

// ===== Admin posts =====
router.get('/admin/posts/pending', authenticate, requireAdmin, postController.getPendingPosts);
router.get('/admin/posts', authenticate, requireAdmin, postController.getAllPostsAdmin);
router.put('/admin/posts/:id/approve', authenticate, requireAdmin, postController.approvePost);
router.put('/admin/posts/:id/reject', authenticate, requireAdmin, postController.rejectPost);

// ===== Search =====
router.get('/search/posts', searchController.searchPosts);
router.get('/search/map', searchController.searchMap);

// ===== Conversations & Messages =====
router.get('/conversations', authenticate, conversationController.getConversations);
router.get('/conversations/:id', authenticate, conversationController.getConversationById);
router.post('/conversations', authenticate, conversationController.createConversation);
router.get('/conversations/:id/messages', authenticate, conversationController.getMessages);
router.post('/conversations/:id/messages', authenticate, conversationController.sendMessage);

// ===== Notifications =====
router.get('/notifications', authenticate, notificationController.getNotifications);
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);

// ===== Reports =====
router.post('/reports', authenticate, reportController.createReport);
router.get('/admin/reports', authenticate, requireAdmin, reportController.getReports);
router.get('/admin/reports/:id', authenticate, requireAdmin, reportController.getReportById);
router.put('/admin/reports/:id/resolve', authenticate, requireAdmin, reportController.resolveReport);
router.put('/admin/reports/:id/reject', authenticate, requireAdmin, reportController.rejectReport);
router.put('/admin/reports/:id/lock-user', authenticate, requireAdmin, reportController.lockReportedUser);

// ===== Stats =====
router.get('/admin/stats', authenticate, requireAdmin, statsController.getStats);

// ===== Upload & AI =====
router.post('/upload/images', authenticate, upload.array('images', 3), uploadController.uploadImages);
router.post('/ai/suggest-tags', authenticate, upload.array('images', 3), uploadController.suggestTags);

module.exports = router;
