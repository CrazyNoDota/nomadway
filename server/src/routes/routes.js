const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, buildRouteSchema } = require('../middleware/validation');
const { sendRouteSummaryEmail } = require('../services/emailService');
const config = require('../config');

// Duration mapping
const DURATION_MAP = {
  '3_hours': 180,
  '1_day': 480,
  '3_days': 1440,
};

/**
 * POST /api/routes/build
 * Build an AI-optimized route
 */
router.post('/build', optionalAuth, validate(buildRouteSchema), async (req, res) => {
  try {
    const {
      duration,
      budget,
      interests,
      activityLevel,
      ageGroup,
      startLocation,
    } = req.body;

    const totalMinutes = DURATION_MAP[duration] || 180;

    // Build database query with filters - OPTIMIZED SQL instead of JS filtering
    const where = {
      isActive: true,
      isDeleted: false,
      ageGroups: { has: ageGroup },
    };

    // Activity level filter
    if (activityLevel === 'easy') {
      where.activityLevel = { in: ['easy'] };
    } else if (activityLevel === 'moderate') {
      where.activityLevel = { in: ['easy', 'moderate'] };
    }
    // 'intense' allows all levels

    // Interests filter - at least one matching interest
    if (interests && interests.length > 0) {
      where.interests = { hasSome: interests };
    }

    // Budget filter
    if (budget) {
      where.AND = [
        { budgetMin: { lte: budget.max } },
        { budgetMax: { gte: budget.min } },
      ];
    }

    // Fetch filtered attractions from database
    const filteredAttractions = await prisma.attraction.findMany({
      where,
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    });

    // Build route with time and budget constraints
    let route = [];
    let totalTime = 0;
    let totalCost = 0;
    let lastLocation = startLocation;

    for (const attraction of filteredAttractions) {
      const visitTime = attraction.averageVisitDuration || 60;
      let travelTime = 0;

      // Calculate travel time if we have coordinates
      if (lastLocation && attraction.latitude && attraction.longitude) {
        const distance = calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          attraction.latitude,
          attraction.longitude
        );
        travelTime = calculateTravelTime(distance);
      }

      const attractionCost = ((attraction.budgetMin || 0) + (attraction.budgetMax || 0)) / 2;

      // Check if we can fit this attraction
      if (totalTime + visitTime + travelTime <= totalMinutes &&
          totalCost + attractionCost <= budget.max) {
        
        const stopDistance = lastLocation && attraction.latitude && attraction.longitude
          ? calculateDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              attraction.latitude,
              attraction.longitude
            )
          : 0;

        route.push({
          attraction: {
            id: attraction.id,
            name: attraction.name,
            nameEn: attraction.nameEn,
            description: attraction.description,
            image: attraction.image,
            rating: attraction.rating,
            category: attraction.category,
            city: attraction.city,
            latitude: attraction.latitude,
            longitude: attraction.longitude,
          },
          visitDuration: visitTime,
          travelTime: travelTime,
          travelDistance: stopDistance,
          estimatedCost: attractionCost,
        });

        totalTime += visitTime + travelTime;
        totalCost += attractionCost;
        lastLocation = {
          latitude: attraction.latitude,
          longitude: attraction.longitude,
        };
      }

      // Stop if we've filled 90% of time
      if (totalTime >= totalMinutes * 0.9) break;
    }

    // Generate alternatives for each stop
    const routeWithAlternatives = await Promise.all(
      route.map(async (stop, index) => {
        const alternatives = filteredAttractions
          .filter(attr =>
            attr.id !== stop.attraction.id &&
            !route.some(r => r.attraction.id === attr.id) &&
            attr.category === stop.attraction.category
          )
          .slice(0, 2)
          .map(alt => ({
            id: alt.id,
            name: alt.name,
            description: alt.description,
            rating: alt.rating,
            estimatedCost: ((alt.budgetMin || 0) + (alt.budgetMax || 0)) / 2,
          }));

        return {
          ...stop,
          orderIndex: index,
          alternatives,
        };
      })
    );

    // If user is authenticated, save the route
    let savedRouteId = null;
    if (req.user) {
      const savedRoute = await prisma.savedRoute.create({
        data: {
          userId: req.user.id,
          name: `Route for ${duration.replace('_', ' ')}`,
          duration,
          totalDuration: Math.round(totalTime),
          totalCost: Math.round(totalCost),
          ageGroup,
          activityLevel,
          interests,
          stops: {
            create: route.map((stop, index) => ({
              attractionId: stop.attraction.id,
              orderIndex: index,
              visitDuration: stop.visitDuration,
              travelTime: stop.travelTime,
              estimatedCost: Math.round(stop.estimatedCost),
            })),
          },
        },
      });

      savedRouteId = savedRoute.id;

      // Award points for completing route builder
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          points: { increment: config.points.completeRoute },
        },
      });
    }

    const response = {
      route: routeWithAlternatives,
      summary: {
        totalDuration: Math.round(totalTime),
        totalCost: Math.round(totalCost),
        numberOfStops: route.length,
        ageGroup,
        activityLevel,
        interests,
      },
      savedRouteId,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/routes/build:', error);
    res.status(500).json({
      error: {
        code: 'BUILD_FAILED',
        message: error.message || 'Internal server error',
      },
    });
  }
});

/**
 * GET /api/routes
 * Get user's saved routes
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const routes = await prisma.savedRoute.findMany({
      where: {
        userId: req.user.id,
        isDeleted: false,
      },
      include: {
        stops: {
          include: {
            attraction: {
              select: {
                id: true,
                name: true,
                image: true,
                city: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      routes: routes.map(route => ({
        id: route.id,
        name: route.name,
        duration: route.duration,
        totalDuration: route.totalDuration,
        totalCost: route.totalCost,
        ageGroup: route.ageGroup,
        activityLevel: route.activityLevel,
        interests: route.interests,
        stopsCount: route.stops.length,
        stops: route.stops.map(stop => ({
          id: stop.id,
          attractionId: stop.attractionId,
          attraction: stop.attraction,
          orderIndex: stop.orderIndex,
          visitDuration: stop.visitDuration,
          travelTime: stop.travelTime,
          estimatedCost: stop.estimatedCost,
        })),
        createdAt: route.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch routes',
      },
    });
  }
});

/**
 * GET /api/routes/:routeId
 * Get a specific route
 */
router.get('/:routeId', authenticate, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.savedRoute.findFirst({
      where: {
        id: routeId,
        userId: req.user.id,
        isDeleted: false,
      },
      include: {
        stops: {
          include: {
            attraction: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!route) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    }

    res.json({
      id: route.id,
      name: route.name,
      duration: route.duration,
      totalDuration: route.totalDuration,
      totalCost: route.totalCost,
      ageGroup: route.ageGroup,
      activityLevel: route.activityLevel,
      interests: route.interests,
      stops: route.stops.map(stop => ({
        id: stop.id,
        orderIndex: stop.orderIndex,
        visitDuration: stop.visitDuration,
        travelTime: stop.travelTime,
        estimatedCost: stop.estimatedCost,
        attraction: {
          id: stop.attraction.id,
          name: stop.attraction.name,
          nameEn: stop.attraction.nameEn,
          description: stop.attraction.description,
          image: stop.attraction.image,
          rating: stop.attraction.rating,
          city: stop.attraction.city,
          latitude: stop.attraction.latitude,
          longitude: stop.attraction.longitude,
        },
      })),
      createdAt: route.createdAt,
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch route',
      },
    });
  }
});

/**
 * DELETE /api/routes/:routeId
 * Soft delete a route
 */
router.delete('/:routeId', authenticate, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.savedRoute.findFirst({
      where: {
        id: routeId,
        userId: req.user.id,
        isDeleted: false,
      },
    });

    if (!route) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    }

    await prisma.savedRoute.update({
      where: { id: routeId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Route deleted' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete route',
      },
    });
  }
});

/**
 * POST /api/routes/:routeId/email
 * Email the route summary to user
 */
router.post('/:routeId/email', authenticate, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await prisma.savedRoute.findFirst({
      where: {
        id: routeId,
        userId: req.user.id,
        isDeleted: false,
      },
      include: {
        stops: {
          include: {
            attraction: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!route) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Send email
    await sendRouteSummaryEmail(user, {
      name: route.name,
      totalDuration: route.totalDuration,
      totalCost: route.totalCost,
      stops: route.stops.map(stop => ({
        name: stop.attraction.name,
        visitDuration: stop.visitDuration,
        estimatedCost: stop.estimatedCost,
        attraction: stop.attraction,
      })),
    });

    res.json({ message: 'Route summary sent to your email' });
  } catch (error) {
    console.error('Email route error:', error);
    res.status(500).json({
      error: {
        code: 'EMAIL_FAILED',
        message: 'Failed to send email',
      },
    });
  }
});

// Helper: Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
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

// Helper: Calculate travel time
function calculateTravelTime(distance) {
  const speedMetersPerMinute = 40000 / 60; // 40 km/h average
  return Math.round(distance / speedMetersPerMinute);
}

module.exports = router;
