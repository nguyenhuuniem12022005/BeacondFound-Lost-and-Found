const uploadService = require('../services/upload.service');
const visionService = require('../services/vision.service');

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

// POST /api/ai/suggest-tags  (multipart field "images" hoặc JSON {filenames})
async function suggestTags(req, res, next) {
  try {
    let files = req.files || [];
    if (files.length === 0 && Array.isArray(req.body?.filenames)) {
      files = req.body.filenames.map((name) => ({ originalname: name, buffer: Buffer.alloc(0) }));
    }
    const tags = await visionService.suggestTags(files);
    res.json({ tags });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImages, suggestTags };
