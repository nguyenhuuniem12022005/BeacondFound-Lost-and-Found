/**
 * AI Vision Service - gợi ý tags từ ảnh.
 * - Nếu có GOOGLE_VISION_API_KEY: gọi Google Vision API (label detection).
 * - Nếu không: mock trả về tag mẫu dựa trên tên file/danh mục.
 */

const MOCK_TAG_BANK = {
  vi: ['ví da', 'màu đen', 'giấy tờ', 'tiền mặt'],
  wallet: ['ví da', 'màu nâu', 'giấy tờ'],
  phone: ['điện thoại', 'smartphone', 'màn hình', 'ốp lưng'],
  'dien-thoai': ['điện thoại', 'smartphone', 'màu đen'],
  key: ['chìa khóa', 'móc khóa', 'kim loại'],
  'chia-khoa': ['chìa khóa', 'móc khóa', 'xe máy'],
  laptop: ['laptop', 'macbook', 'màu bạc', 'đồ điện tử'],
  dog: ['thú cưng', 'chó', 'lông vàng'],
  cat: ['thú cưng', 'mèo', 'lông ngắn'],
  bag: ['balo', 'túi xách', 'vải'],
  headphone: ['tai nghe', 'không dây', 'màu trắng'],
  default: ['đồ vật', 'cá nhân', 'thất lạc', 'cần xác minh'],
};

function mockSuggestTags(filenames = []) {
  const tags = new Set();
  const joined = filenames.join(' ').toLowerCase();
  for (const [keyword, list] of Object.entries(MOCK_TAG_BANK)) {
    if (keyword !== 'default' && joined.includes(keyword)) {
      list.forEach((t) => tags.add(t));
    }
  }
  if (tags.size === 0) {
    MOCK_TAG_BANK.default.forEach((t) => tags.add(t));
  }
  return Array.from(tags).slice(0, 6);
}

async function googleVisionSuggestTags(imageBuffers) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  const results = new Set();
  for (const buffer of imageBuffers) {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: buffer.toString('base64') },
              features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
            },
          ],
        }),
      }
    );
    const data = await res.json();
    const labels = data.responses?.[0]?.labelAnnotations || [];
    labels.forEach((l) => results.add(l.description.toLowerCase()));
  }
  return Array.from(results).slice(0, 8);
}

/**
 * Gợi ý tags từ ảnh upload.
 * @param {Express.Multer.File[]} files
 * @returns {Promise<string[]>}
 */
async function suggestTags(files = []) {
  if (process.env.GOOGLE_VISION_API_KEY) {
    return googleVisionSuggestTags(files.map((f) => f.buffer));
  }
  return mockSuggestTags(files.map((f) => f.originalname || ''));
}

module.exports = { suggestTags };
