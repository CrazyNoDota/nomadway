const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, checkInSchema } = require('../middleware/validation');
const config = require('../config');

/**
 * Check and award achievements based on user progress
 * This is called automatically after check-ins and other actions
 */
async function checkAndAwardAchievements(userId) {
  try {
    // Get user's current stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        placesVisited: true,
        checkIns: true,
        achievements: {
          include: { achievement: true },
        },
      },
    });

    if (!user) return [];

    // Get unique cities visited
    const citiesVisited = new Set(user.placesVisited.map(p => p.city).filter(Boolean));
    
    // Calculate total distance walked
    const totalDistance = user.checkIns.reduce((sum, c) => sum + (c.distance || 0), 0);

    // Get all achievements not yet earned
    const earnedAchievementKeys = user.achievements.map(ua => ua.achievement.achievementKey);
    const availableAchievements = await prisma.achievement.findMany({
      where: {
        achievementKey: { notIn: earnedAchievementKeys },
        isActive: true,
      },
    });

    const newAchievements = [];

    for (const achievement of availableAchievements) {
      let earned = false;

      switch (achievement.category) {
        case 'places_visited':
          earned = user.placesVisited.length >= achievement.threshold;
          break;
        case 'cities_visited':
          earned = citiesVisited.size >= achievement.threshold;
          break;
        case 'distance_walked':
          earned = totalDistance >= achievement.threshold;
          break;
        case 'routes_completed':
          // TODO: Implement routes completed tracking
          break;
      }

      if (earned) {
        // Award achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        // Add points
        await prisma.user.update({
          where: { id: userId },
          data: {
            points: { increment: achievement.pointsReward },
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId,
            type: 'achievement',
            title: '🏆 New Achievement!',
            message: `You earned "${achievement.title}"!`,
            data: { achievementId: achievement.id, points: achievement.pointsReward },
          },
        });

        newAchievements.push({
          id: achievement.id,
          key: achievement.achievementKey,
          title: achievement.title,
          points: achievement.pointsReward,
          icon: achievement.icon,
        });
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

/**
 * POST /api/gamification/checkin
 * Check in at a place
 */
router.post('/checkin', authenticate, validate(checkInSchema), async (req, res) => {
  try {
    const { placeId, latitude, longitude } = req.body;

    // Get attraction
    const attraction = await prisma.attraction.findUnique({
      where: { id: placeId },
    });

    if (!attraction) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Place not found',
        },
      });
    }

    // Calculate distance if coordinates provided
    let distance = 0;
    if (latitude && longitude && attraction.latitude && attraction.longitude) {
      distance = calculateDistance(
        latitude,
        longitude,
        attraction.latitude,
        attraction.longitude
      );
    }

    // Check if already visited today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: req.user.id,
        placeId,
        checkedInAt: { gte: today },
      },
    });

    let pointsEarned = 0;

    if (!existingCheckIn) {
      pointsEarned = config.points.checkIn;

      // Create check-in
      await prisma.checkIn.create({
        data: {
          userId: req.user.id,
          placeId,
          latitude,
          longitude,
          distance,
          pointsEarned,
        },
      });

      // Update user points
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          points: { increment: pointsEarned },
        },
      });
    }

    // Track place visit (unique)
    const existingVisit = await prisma.placeVisit.findUnique({
      where: {
        userId_placeId: {
          userId: req.user.id,
          placeId,
        },
      },
    });

    let isFirstVisit = false;
    if (!existingVisit) {
      isFirstVisit = true;
      pointsEarned += config.points.visitPlace;

      await prisma.placeVisit.create({
        data: {
          userId: req.user.id,
          placeId,
          placeName: attraction.name,
          city: attraction.city,
        },
      });

      // Update user points for first visit
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          points: { increment: config.points.visitPlace },
        },
      });
    }

    // Check for new achievements
    const newAchievements = await checkAndAwardAchievements(req.user.id);

    // Get updated user stats
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        points: true,
        _count: {
          select: {
            placesVisited: true,
            achievements: true,
          },
        },
      },
    });

    res.json({
      success: true,
      isFirstVisit,
      pointsEarned,
      totalPoints: updatedUser.points,
      placesVisited: updatedUser._count.placesVisited,
      newAchievements,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      error: {
        code: 'CHECKIN_FAILED',
        message: 'Failed to check in',
      },
    });
  }
});

/**
 * GET /api/gamification/progress
 * Get user's gamification progress
 */
router.get('/progress', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        placesVisited: {
          include: { attraction: true },
          orderBy: { visitedAt: 'desc' },
          take: 10,
        },
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: 'desc' },
        },
        checkIns: {
          orderBy: { checkedInAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Calculate stats
    const citiesVisited = new Set(user.placesVisited.map(p => p.city).filter(Boolean));
    const totalDistance = user.checkIns.reduce((sum, c) => sum + (c.distance || 0), 0);

    // Get all achievements to show progress
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { threshold: 'asc' },
    });

    const achievementsWithProgress = allAchievements.map(achievement => {
      const earned = user.achievements.find(ua => ua.achievementId === achievement.id);
      let progress = 0;

      switch (achievement.category) {
        case 'places_visited':
          progress = Math.min(100, (user.placesVisited.length / achievement.threshold) * 100);
          break;
        case 'cities_visited':
          progress = Math.min(100, (citiesVisited.size / achievement.threshold) * 100);
          break;
        case 'distance_walked':
          progress = Math.min(100, (totalDistance / achievement.threshold) * 100);
          break;
      }

      return {
        ...achievement,
        earned: !!earned,
        earnedAt: earned?.earnedAt,
        progress: Math.round(progress),
      };
    });

    res.json({
      points: user.points,
      stats: {
        placesVisited: user.placesVisited.length,
        citiesVisited: citiesVisited.size,
        distanceWalked: Math.round(totalDistance),
        achievementsEarned: user.achievements.length,
        checkIns: user.checkIns.length,
      },
      recentPlaces: user.placesVisited.map(pv => ({
        id: pv.id,
        placeId: pv.placeId,
        placeName: pv.placeName,
        city: pv.city,
        visitedAt: pv.visitedAt,
        attraction: pv.attraction,
      })),
      achievements: achievementsWithProgress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch progress',
      },
    });
  }
});

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard
 */
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { period = 'all_time', limit = 50 } = req.query;

    let dateFilter = {};
    
    if (period === 'weekly') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        ...dateFilter,
      },
      select: {
        id: true,
        displayName: true,
        fullName: true,
        avatarUrl: true,
        points: true,
        _count: {
          select: {
            achievements: true,
            placesVisited: true,
          },
        },
      },
      orderBy: { points: 'desc' },
      take: parseInt(limit),
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      name: user.displayName || user.fullName || 'Anonymous',
      avatarUrl: user.avatarUrl,
      points: user.points,
      achievements: user._count.achievements,
      placesVisited: user._count.placesVisited,
      isCurrentUser: req.user?.id === user.id,
    }));

    // Get current user's rank if logged in
    let currentUserRank = null;
    if (req.user) {
      const userRank = leaderboard.findIndex(u => u.userId === req.user.id);
      if (userRank >= 0) {
        currentUserRank = userRank + 1;
      } else {
        // User not in top, count their position
        const usersAbove = await prisma.user.count({
          where: {
            points: { gt: req.user.points },
            isActive: true,
            isDeleted: false,
          },
        });
        currentUserRank = usersAbove + 1;
      }
    }

    res.json({
      leaderboard,
      period,
      currentUserRank,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch leaderboard',
      },
    });
  }
});

/**
 * GET /api/gamification/achievements
 * Get all available achievements
 */
router.get('/achievements', optionalAuth, async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { threshold: 'asc' },
      ],
    });

    let userAchievements = [];
    if (req.user) {
      const userAch = await prisma.userAchievement.findMany({
        where: { userId: req.user.id },
        select: { achievementId: true, earnedAt: true },
      });
      userAchievements = userAch.reduce((acc, ua) => {
        acc[ua.achievementId] = ua.earnedAt;
        return acc;
      }, {});
    }

    res.json({
      achievements: achievements.map(a => ({
        ...a,
        earned: !!userAchievements[a.id],
        earnedAt: userAchievements[a.id] || null,
      })),
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch achievements',
      },
    });
  }
});

// Helper: Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

module.exports = router;
