const prisma = require('../config/prisma');

// GET /api/categories
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

// POST /api/categories (admin)
async function createCategory(req, res, next) {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return res.status(409).json({ message: 'Danh mục đã tồn tại' });
    const category = await prisma.category.create({ data: { name: name.trim(), icon } });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id (admin)
async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên danh mục không được để trống' });
    }
    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), ...(icon !== undefined && { icon }) },
    });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id (admin)
async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
