const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, createAttractionSchema, updateAttractionSchema, moderatePostSchema } = require('../middleware/validation');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ================== DASHBOARD STATS ==================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAttractions,
      totalPosts,
      totalComments,
      pendingReports,
      usersThisWeek,
      postsThisWeek,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({
        where: {
          isActive: true,
          isDeleted: false,
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.attraction.count({ where: { isActive: true, isDeleted: false } }),
      prisma.communityPost.count({ where: { isDeleted: false } }),
      prisma.comment.count({ where: { isDeleted: false } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.communityPost.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Top users by points
    const topUsers = await prisma.user.findMany({
      where: { isActive: true, isDeleted: false },
      orderBy: { points: 'desc' },
      take: 10,
      select: {
        id: true,
        displayName: true,
        email: true,
        points: true,
        avatarUrl: true,
      },
    });

    // Recent reports
    const recentReports = await prisma.report.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        reporter: {
          select: { displayName: true, email: true },
        },
        reported: {
          select: { displayName: true, email: true },
        },
        post: {
          select: { title: true },
        },
      },
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalAttractions,
        totalPosts,
        totalComments,
        pendingReports,
        usersThisWeek,
        postsThisWeek,
      },
      topUsers,
      recentReports,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch statistics',
      },
    });
  }
});

// ================== USER MANAGEMENT ==================

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const { search, role, limit = 50, offset = 0 } = req.query;

    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
          points: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              achievements: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch users',
      },
    });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user (role, active status)
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive, points } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(points !== undefined && { points }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
        points: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update user',
      },
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Soft delete a user
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        error: {
          code: 'INVALID_OPERATION',
          message: 'Cannot delete your own account',
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete user',
      },
    });
  }
});

// ================== ATTRACTION MANAGEMENT ==================

/**
 * GET /api/admin/attractions
 * Get all attractions including inactive ones
 */
router.get('/attractions', async (req, res) => {
  try {
    const { search, region, isActive, limit = 50, offset = 0 } = req.query;

    const where = { isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (region) {
      where.region = region;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.attraction.count({ where }),
    ]);

    res.json({
      attractions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get attractions error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch attractions',
      },
    });
  }
});

/**
 * POST /api/admin/attractions
 * Create new attraction
 */
router.post('/attractions', validate(createAttractionSchema), async (req, res) => {
  try {
    const attraction = await prisma.attraction.create({
      data: req.body,
    });

    res.status(201).json({ attraction });
  } catch (error) {
    console.error('Create attraction error:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create attraction',
      },
    });
  }
});

/**
 * PUT /api/admin/attractions/:attractionId
 * Update attraction
 */
router.put('/attractions/:attractionId', validate(updateAttractionSchema), async (req, res) => {
  try {
    const { attractionId } = req.params;

    const attraction = await prisma.attraction.update({
      where: { id: parseInt(attractionId) },
      data: req.body,
    });

    res.json({ attraction });
  } catch (error) {
    console.error('Update attraction error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update attraction',
      },
    });
  }
});

/**
 * DELETE /api/admin/attractions/:attractionId
 * Soft delete attraction
 */
router.delete('/attractions/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;

    await prisma.attraction.update({
      where: { id: parseInt(attractionId) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    res.json({ message: 'Attraction deleted' });
  } catch (error) {
    console.error('Delete attraction error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete attraction',
      },
    });
  }
});

// ================== POST MODERATION ==================

/**
 * GET /api/admin/posts
 * Get all posts for moderation
 */
router.get('/posts', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const where = { isDeleted: false };

    if (status === 'hidden') {
      where.isHidden = true;
    } else if (status === 'visible') {
      where.isHidden = false;
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              reports: true,
            },
          },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch posts',
      },
    });
  }
});

/**
 * PUT /api/admin/posts/:postId/moderate
 * Moderate a post (hide/unhide/delete)
 */
router.put('/posts/:postId/moderate', validate(moderatePostSchema), async (req, res) => {
  try {
    const { postId } = req.params;
    const { action, reason } = req.body;

    let updateData = {};

    switch (action) {
      case 'hide':
        updateData = { isHidden: true, hiddenReason: reason };
        break;
      case 'unhide':
        updateData = { isHidden: false, hiddenReason: null };
        break;
      case 'delete':
        updateData = { isDeleted: true, deletedAt: new Date() };
        break;
    }

    const post = await prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
    });

    res.json({ post, message: `Post ${action}d successfully` });
  } catch (error) {
    console.error('Moderate post error:', error);
    res.status(500).json({
      error: {
        code: 'MODERATION_FAILED',
        message: 'Failed to moderate post',
      },
    });
  }
});

// ================== REPORTS ==================

/**
 * GET /api/admin/reports
 * Get all reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          reporter: {
            select: { id: true, displayName: true, email: true },
          },
          reported: {
            select: { id: true, displayName: true, email: true },
          },
          post: {
            select: { id: true, title: true, body: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch reports',
      },
    });
  }
});

/**
 * PUT /api/admin/reports/:reportId
 * Update report status
 */
router.put('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['reviewed', 'dismissed', 'action_taken'].includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status',
        },
      });
    }

    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    });

    res.json({ report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update report',
      },
    });
  }
});

// ================== ANALYTICS ==================

/**
 * GET /api/admin/analytics
 * Get detailed analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // User growth
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    // Post activity
    const newPosts = await prisma.communityPost.count({
      where: { createdAt: { gte: startDate } },
    });

    // Check-ins
    const newCheckIns = await prisma.checkIn.count({
      where: { checkedInAt: { gte: startDate } },
    });

    // Top attractions by visits
    const topAttractions = await prisma.placeVisit.groupBy({
      by: ['placeId'],
      _count: { placeId: true },
      where: { visitedAt: { gte: startDate } },
      orderBy: { _count: { placeId: 'desc' } },
      take: 10,
    });

    const attractionDetails = await prisma.attraction.findMany({
      where: { id: { in: topAttractions.map(a => a.placeId) } },
      select: { id: true, name: true, image: true },
    });

    const topAttractionsWithDetails = topAttractions.map(ta => ({
      ...attractionDetails.find(a => a.id === ta.placeId),
      visitCount: ta._count.placeId,
    }));

    res.json({
      period,
      startDate,
      metrics: {
        newUsers,
        newPosts,
        newCheckIns,
      },
      topAttractions: topAttractionsWithDetails,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch analytics',
      },
    });
  }
});

module.exports = router;
