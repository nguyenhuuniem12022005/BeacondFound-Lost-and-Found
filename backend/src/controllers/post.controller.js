const prisma = require('../config/prisma');
const notificationService = require('../services/notification.service');

const POST_INCLUDE = {
  user: { select: { id: true, fullName: true, avatarUrl: true, email: true, createdAt: true } },
  category: true,
  images: true,
  postTags: { include: { tag: true } },
};

function formatPost(post) {
  if (!post) return post;
  const { postTags, ...rest } = post;
  return { ...rest, tags: (postTags || []).map((pt) => pt.tag) };
}

async function attachTags(postId, tagNames = []) {
  await prisma.postTag.deleteMany({ where: { postId } });
  for (const raw of tagNames) {
    const name = String(raw).trim().toLowerCase();
    if (!name) continue;
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.postTag.upsert({
      where: { postId_tagId: { postId, tagId: tag.id } },
      update: {},
      create: { postId, tagId: tag.id },
    });
  }
}

// GET /api/posts  (feed công khai - chỉ bài ACTIVE)
async function getPosts(req, res, next) {
  try {
    const { type, categoryId, limit = 30 } = req.query;
    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        ...(type && { type }),
        ...(categoryId && { categoryId: Number(categoryId) }),
      },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/my  (bài của chính mình)
async function getMyPosts(req, res, next) {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.user.id },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id
async function getPostById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    const isOwner = req.user && req.user.id === post.userId;
    const isAdmin = req.user && req.user.role === 'ADMIN';
    if (post.status !== 'ACTIVE' && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bài đăng chưa được duyệt' });
    }
    res.json({ post: formatPost(post) });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts
async function createPost(req, res, next) {
  try {
    const { title, type, description, eventDate, address, latitude, longitude, categoryId, images = [], tags = [] } = req.body;
    if (!title || !type || !description || !eventDate || !address || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bài đăng' });
    }
    if (!['LOST', 'FOUND'].includes(type)) {
      return res.status(400).json({ message: 'Loại bài đăng không hợp lệ' });
    }
    if (images.length > 3) {
      return res.status(400).json({ message: 'Chỉ được tải tối đa 3 ảnh' });
    }
    const post = await prisma.post.create({
      data: {
        title,
        type,
        description,
        eventDate: new Date(eventDate),
        address,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status: 'PENDING',
        userId: req.user.id,
        categoryId: categoryId ? Number(categoryId) : null,
        images: { create: images.map((url) => ({ imageUrl: url })) },
      },
    });
    await attachTags(post.id, tags);
    const full = await prisma.post.findUnique({ where: { id: post.id }, include: POST_INCLUDE });
    res.status(201).json({ post: formatPost(full) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id
async function updatePost(req, res, next) {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    }
    if (post.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền sửa bài đăng này' });
    }
    const { title, type, description, eventDate, address, latitude, longitude, categoryId, images, tags } = req.body;

    // Sửa bài đang ACTIVE -> chuyển về PENDING để admin duyệt lại
    const newStatus = post.status === 'ACTIVE' ? 'PENDING' : post.status;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude: Number(latitude) }),
        ...(longitude !== undefined && { longitude: Number(longitude) }),
        ...(categoryId !== undefined && { categoryId: categoryId ? Number(categoryId) : null }),
        status: newStatus,
      },
    });

    if (Array.isArray(images)) {
      await prisma.postImage.deleteMany({ where: { postId: id } });
      await prisma.postImage.createMany({
        data: images.slice(0, 3).map((url) => ({ postId: id, imageUrl: url })),
      });
    }
    if (Array.isArray(tags)) {
      await attachTags(id, tags);
    }
    const full = await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    res.json({ post: formatPost(full) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res, next) {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài đăng này' });
    }
    if (req.user.role === 'ADMIN' && post.userId !== req.user.id) {
      const content = `Bài đăng "${post.title}" của bạn đã bị xóa do vi phạm quy định.`;
      const notification = await prisma.$transaction(async (tx) => {
        const createdNotification = await tx.notification.create({
          data: {
            userId: post.userId,
            type: 'POST_DELETED',
            content,
            targetUrl: null,
          },
        });
        await tx.post.delete({ where: { id } });
        return createdNotification;
      });
      notificationService.dispatchNotification(notification);
    } else {
      await prisma.post.delete({ where: { id } });
    }
    res.json({ message: 'Đã xóa vĩnh viễn bài đăng' });
  } catch (err) {
    next(err);
  }
}

// ===== ADMIN =====

// GET /api/admin/posts/pending
async function getPendingPosts(req, res, next) {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PENDING' },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/posts  (tất cả bài cho admin, lọc theo status)
async function getAllPostsAdmin(req, res, next) {
  try {
    const { status } = req.query;
    const posts = await prisma.post.findMany({
      where: { ...(status ? { status } : {}) },
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/posts/:id/approve
async function approvePost(req, res, next) {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: POST_INCLUDE,
    });
    await notificationService.createNotification({
      userId: post.userId,
      type: 'POST_APPROVED',
      content: `Bài đăng "${post.title}" của bạn đã được duyệt và hiển thị công khai.`,
      targetUrl: `/posts/${post.id}`,
    });
    res.json({ post: formatPost(post) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/posts/:id/reject
async function rejectPost(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body || {};
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài đăng' });
    if (post.status !== 'PENDING') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối bài đăng đang chờ duyệt' });
    }

    const content = `Bài đăng "${post.title}" của bạn đã bị từ chối${reason ? `: ${reason}` : '.'}`;
    const notification = await prisma.$transaction(async (tx) => {
      const createdNotification = await tx.notification.create({
        data: {
          userId: post.userId,
          type: 'POST_REJECTED',
          content,
          targetUrl: null,
        },
      });
      await tx.post.delete({ where: { id } });
      return createdNotification;
    });
    notificationService.dispatchNotification(notification);
    res.json({ message: 'Đã từ chối và xóa vĩnh viễn bài đăng' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPosts,
  getMyPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPendingPosts,
  getAllPostsAdmin,
  approvePost,
  rejectPost,
  formatPost,
  POST_INCLUDE,
};
