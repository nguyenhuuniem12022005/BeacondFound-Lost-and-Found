const visionService = require('../services/vision.service');

/**
 * AIVisionController - kết nối dịch vụ AI Vision để gợi ý thẻ (Tag) từ ảnh.
 */

// POST /api/ai/suggest-tags  (multipart field "images" hoặc JSON {filenames})
async function analyzeImage(req, res, next) {
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

module.exports = { analyzeImage };
