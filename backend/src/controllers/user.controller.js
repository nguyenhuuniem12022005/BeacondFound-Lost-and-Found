const prisma = require('../config/prisma');

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/users/profile
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        posts: {
          include: { images: true, category: true, postTags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
