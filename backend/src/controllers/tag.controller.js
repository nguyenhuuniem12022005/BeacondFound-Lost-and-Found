const prisma = require('../config/prisma');

/**
 * TagController - xử lý thẻ (Tag) cho bài đăng.
 */

// Lấy thẻ đã tồn tại hoặc tạo mới theo tên, trả về danh sách bản ghi Tag.
async function getOrCreateTags(tagNames = []) {
  const tags = [];
  for (const raw of tagNames) {
    const name = String(raw).trim().toLowerCase();
    if (!name) continue;
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    tags.push(tag);
  }
  return tags;
}

// Gắn danh sách thẻ cho một bài đăng (ghi đè liên kết cũ).
async function addPostTags(postId, tagNames = []) {
  const tags = await getOrCreateTags(tagNames);
  await prisma.postTag.deleteMany({ where: { postId } });
  for (const tag of tags) {
    await prisma.postTag.upsert({
      where: { postId_tagId: { postId, tagId: tag.id } },
      update: {},
      create: { postId, tagId: tag.id },
    });
  }
  return true;
}

module.exports = { getOrCreateTags, addPostTags };
