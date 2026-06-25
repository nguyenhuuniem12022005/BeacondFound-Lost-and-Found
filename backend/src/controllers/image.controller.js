const prisma = require('../config/prisma');
const uploadService = require('../services/upload.service');

/**
 * ImageController - xử lý hình ảnh minh chứng của bài đăng.
 */

// POST /api/upload/images  (multipart, field "images", tối đa 3)
async function uploadImages(req, res, next) {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Chưa chọn ảnh để tải lên' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = await uploadService.uploadImages(files, baseUrl);
    res.status(201).json({ urls });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id/images  -> getImagesByPost(p): PostImage[]
async function getImagesByPost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const images = await prisma.postImage.findMany({
      where: { postId },
      orderBy: { id: 'asc' },
    });
    res.json({ images });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImages, getImagesByPost };
