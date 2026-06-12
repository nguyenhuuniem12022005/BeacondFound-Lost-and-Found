const prisma = require('../config/prisma');
const { haversineKm } = require('../services/geo.service');
const { formatPost, POST_INCLUDE } = require('./post.controller');

// GET /api/search/posts?keyword=&type=&categoryId=&tag=&from=&to=
async function searchPosts(req, res, next) {
  try {
    const { keyword, type, categoryId, tag, from, to } = req.query;
    const where = {
      status: 'ACTIVE',
      ...(type && { type }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(from || to
        ? {
            eventDate: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
      ...(keyword && {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { address: { contains: keyword, mode: 'insensitive' } },
          { postTags: { some: { tag: { name: { contains: keyword, mode: 'insensitive' } } } } },
        ],
      }),
      ...(tag && {
        postTags: { some: { tag: { name: { equals: tag, mode: 'insensitive' } } } },
      }),
    };
    const posts = await prisma.post.findMany({
      where,
      include: POST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    res.json({ posts: posts.map(formatPost) });
  } catch (err) {
    next(err);
  }
}

// GET /api/search/map?lat=&lng=&radius=&type=&categoryId=
async function searchMap(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 5); // km
    const { type, categoryId } = req.query;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'Thiếu tọa độ trung tâm' });
    }
    const posts = await prisma.post.findMany({
      where: {
        status: 'ACTIVE',
        ...(type && { type }),
        ...(categoryId && { categoryId: Number(categoryId) }),
      },
      include: POST_INCLUDE,
    });
    const result = posts
      .map((p) => ({ ...formatPost(p), distanceKm: haversineKm(lat, lng, p.latitude, p.longitude) }))
      .filter((p) => p.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    res.json({ posts: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchPosts, searchMap };
