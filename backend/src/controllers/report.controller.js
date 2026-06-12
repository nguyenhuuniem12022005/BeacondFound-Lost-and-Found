const prisma = require('../config/prisma');
const notificationService = require('../services/notification.service');

const REPORT_INCLUDE = {
  reporter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  reportedUser: { select: { id: true, fullName: true, email: true, avatarUrl: true, status: true } },
  post: {
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true } },
      images: true,
    },
  },
};

// POST /api/reports  { postId?, reportedUserId?, reason }
async function createReport(req, res, next) {
  try {
    const { postId, reportedUserId, reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do báo cáo' });
    }
    if (!postId && !reportedUserId) {
      return res.status(400).json({ message: 'Thiếu đối tượng bị báo cáo' });
    }
    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        postId: postId ? Number(postId) : null,
        reportedUserId: reportedUserId ? Number(reportedUserId) : null,
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: REPORT_INCLUDE,
    });
    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports?status=
async function getReports(req, res, next) {
  try {
    const { status } = req.query;
    const reports = await prisma.report.findMany({
      where: { ...(status ? { status } : {}) },
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reports/:id
async function getReportById(req, res, next) {
  try {
    const id = Number(req.params.id);
    const report = await prisma.report.findUnique({ where: { id }, include: REPORT_INCLUDE });
    if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/reports/:id/resolve
async function resolveReport(req, res, next) {
  try {
    const id = Number(req.params.id);
    const report = await prisma.report.update({
      where: { id },
      data: { status: 'RESOLVED' },
      include: REPORT_INCLUDE,
    });
    await notificationService.createNotification({
      userId: report.reporterId,
      type: 'REPORT_RESOLVED',
      content: 'Báo cáo vi phạm của bạn đã được xử lý. Cảm ơn bạn đã góp phần xây dựng cộng đồng an toàn.',
      targetUrl: null,
    });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/reports/:id/reject
async function rejectReport(req, res, next) {
  try {
    const id = Number(req.params.id);
    const report = await prisma.report.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: REPORT_INCLUDE,
    });
    await notificationService.createNotification({
      userId: report.reporterId,
      type: 'REPORT_REJECTED',
      content: 'Báo cáo vi phạm của bạn đã được xem xét và bị từ chối do không đủ căn cứ.',
      targetUrl: null,
    });
    res.json({ report });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport, getReports, getReportById, resolveReport, rejectReport };
