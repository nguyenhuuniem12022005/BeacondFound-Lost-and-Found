const prisma = require('../config/prisma');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * GET /api/admin/stats?period=week|month
 * Trả về tổng quan + chuỗi thời gian người dùng mới / bài đăng mới.
 */
async function getStats(req, res, next) {
  try {
    const period = req.query.period === 'month' ? 'month' : 'week';
    const now = new Date();

    const [totalUsers, totalPosts, pendingPosts, activePosts, pendingReports] =
      await Promise.all([
        prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
        prisma.post.count(),
        prisma.post.count({ where: { status: 'PENDING' } }),
        prisma.post.count({ where: { status: 'ACTIVE' } }),
        prisma.report.count({ where: { status: 'PENDING' } }),
      ]);

    // Chuỗi thời gian: 7 ngày gần nhất (week) hoặc 30 ngày gần nhất (month)
    const days = period === 'month' ? 30 : 7;
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 86400000));
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      series.push({ date: dayStart.toISOString().slice(0, 10), dayStart, dayEnd });
    }
    const [usersByDay, postsByDay] = await Promise.all([
      Promise.all(
        series.map((s) =>
          prisma.user.count({ where: { createdAt: { gte: s.dayStart, lt: s.dayEnd } } })
        )
      ),
      Promise.all(
        series.map((s) =>
          prisma.post.count({ where: { createdAt: { gte: s.dayStart, lt: s.dayEnd } } })
        )
      ),
    ]);

    const chart = series.map((s, i) => ({
      date: s.date,
      newUsers: usersByDay[i],
      newPosts: postsByDay[i],
    }));

    const periodStart = series[0].dayStart;
    const [newUsersInPeriod, newPostsInPeriod] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.post.count({ where: { createdAt: { gte: periodStart } } }),
    ]);

    // Hoạt động gần đây
    const [recentPosts, recentReports, recentUsers] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { fullName: true } } },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { reporter: { select: { fullName: true } } },
      }),
      prisma.user.findMany({
        where: { role: 'MEMBER' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { fullName: true, createdAt: true },
      }),
    ]);

    const activities = [
      ...recentPosts.map((p) => ({
        time: p.createdAt,
        event: `Đăng bài mới (${p.type === 'LOST' ? 'Mất đồ' : 'Nhặt được'}): ${p.title}`,
        user: p.user.fullName,
        status: p.status,
      })),
      ...recentReports.map((r) => ({
        time: r.createdAt,
        event: 'Báo cáo vi phạm',
        user: r.reporter.fullName,
        status: r.status,
      })),
      ...recentUsers.map((u) => ({
        time: u.createdAt,
        event: 'Đăng ký tài khoản mới',
        user: u.fullName,
        status: 'ACTIVE',
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8);

    res.json({
      totals: {
        totalUsers,
        totalPosts,
        pendingPosts,
        activePosts,
        pendingReports,
        newUsersInPeriod,
        newPostsInPeriod,
      },
      chart,
      activities,
      period,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
