const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, buildRouteSchema } = require('../middleware/validation');
const { sendRouteSummaryEmail } = require('../services/emailService');
const { curateRoute } = require('../services/routeCurator');
const config = require('../config');

// Active minutes per day used to scale multi-day trips
const MINUTES_PER_DAY = 480;

// Parse "3_hours" or "<N>_days" into the values the rest of the file expects.
// `tier` keeps the legacy short/single/multi-day heuristic switches working
// without exploding into N branches.
function parseDuration(duration) {
  if (duration === '3_hours') {
    return { tier: '3_hours', days: 0, minutes: 180 };
  }
  const m = String(duration || '').match(/^(\d+)_days?$/);
  if (m) {
    const days = Math.max(1, parseInt(m[1], 10));
    const tier = days >= 2 ? '3_days' : '1_day';
    return { tier, days, minutes: days * MINUTES_PER_DAY };
  }
  return { tier: '1_day', days: 1, minutes: MINUTES_PER_DAY };
}

// PostgreSQL INT4 ceiling — Prisma Int columns overflow above this.
const INT4_MAX = 2147483647;
const clampInt = (n) => Math.max(0, Math.min(INT4_MAX, Math.round(Number(n) || 0)));

/**
 * POST /api/routes/build
 * Build an AI-optimized route
 */
router.post('/build', optionalAuth, validate(buildRouteSchema), async (req, res) => {
  try {
    const {
      duration,
      budget: rawBudget,
      interests,
      activityLevel,
      ageGroup,
      description,
      startLocation,
    } = req.body;

    // Budget is optional. When the user leaves it blank, treat it as "no
    // ceiling" so we rank by interests / description without filtering anything
    // out. When present, clamp to INT4 range so Prisma doesn't blow up on
    // stray big numbers. Downstream curators always receive a budget object —
    // an unbounded one (max=INT4_MAX) when the user did not specify limits.
    const budgetProvided = !!rawBudget && (rawBudget.min != null || rawBudget.max != null);
    const budget = budgetProvided
      ? (() => {
          const b = {
            min: clampInt(rawBudget.min ?? 0),
            max: clampInt(rawBudget.max ?? INT4_MAX),
          };
          if (b.max < b.min) b.max = b.min;
          return b;
        })()
      : { min: 0, max: INT4_MAX };

    const { minutes: totalMinutes } = parseDuration(duration);

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

    // Budget filter: max budget is the affordability ceiling. Do not exclude
    // cheaper stops just because the user can spend more. Skip the filter
    // entirely when the user did not provide a budget.
    if (budgetProvided) {
      where.AND = [
        { budgetMin: { lte: budget.max } },
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

    // === LLM-first curation =============================================
    // Ask the NVIDIA LLM to design the itinerary from the candidate pool.
    // If it fails or returns nothing usable, fall back to the greedy loop.
    let narrative = '';
    let curationSource = 'heuristic';
    let orderedAttractions = filteredAttractions;
    const curated = await curateRoute(filteredAttractions, {
      duration,
      totalMinutes,
      ageGroup,
      activityLevel,
      interests,
      description,
      budget,
    });
    const whyById = new Map();
    const dayById = new Map();
    const slotById = new Map();
    if (curated && curated.stops.length) {
      narrative = curated.narrative;
      curationSource = curated.source;
      orderedAttractions = curated.stops.map((s) => s.attraction);
      curated.stops.forEach((s, idx) => {
        whyById.set(s.attraction.id, s.why);
        dayById.set(s.attraction.id, s.day);
        slotById.set(s.attraction.id, s.timeSlot);
      });
    }

    // Build a geographically coherent route. The LLM can suggest a story/order,
    // but the server chooses the actual sequence so we do not end up with one
    // expensive/far-away stop when a nearby cluster could fit several places.
    const routePlan = buildCoherentRoute({
      candidates: filteredAttractions,
      preferredOrder: orderedAttractions,
      totalMinutes,
      budget,
      startLocation,
      duration,
      interests,
      description,
    });

    const route = routePlan.route.map((stop, index) => ({
      attraction: {
        id: stop.attraction.id,
        name: stop.attraction.name,
        nameEn: stop.attraction.nameEn,
        description: stop.attraction.description,
        image: stop.attraction.image,
        rating: stop.attraction.rating,
        category: stop.attraction.category,
        city: stop.attraction.city,
        latitude: stop.attraction.latitude,
        longitude: stop.attraction.longitude,
      },
      visitDuration: stop.visitDuration,
      travelTime: stop.travelTime,
      travelDistance: stop.travelDistance,
      estimatedCost: stop.estimatedCost,
      why: whyById.get(stop.attraction.id) || buildHeuristicWhy(stop.attraction, index),
      day: dayById.get(stop.attraction.id) || stop.day,
      timeSlot: slotById.get(stop.attraction.id) || stop.timeSlot,
    }));
    let totalTime = routePlan.totalTime;
    let totalCost = routePlan.totalCost;

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
        narrative,
        curationSource, // 'llm' or 'heuristic' — useful for debugging / UI hints
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

function estimateCost(attraction) {
  return ((attraction.budgetMin || 0) + (attraction.budgetMax || 0)) / 2;
}

function plannedVisitDuration(attraction, duration) {
  const { tier } = parseDuration(duration);
  const raw = attraction.averageVisitDuration || 60;
  const caps = {
    '3_hours': 75,
    '1_day': 120,
    '3_days': 180,
  };
  const floors = {
    '3_hours': 35,
    '1_day': 45,
    '3_days': 60,
  };

  return Math.max(floors[tier] || 45, Math.min(raw, caps[tier] || 120));
}

function hasCoordinates(attraction) {
  return Number.isFinite(Number(attraction.latitude)) && Number.isFinite(Number(attraction.longitude));
}

function travelBetween(from, to) {
  if (!from || !hasCoordinates(to)) {
    return { distance: 0, minutes: 0 };
  }

  const fromLat = from.latitude;
  const fromLon = from.longitude;
  if (!Number.isFinite(Number(fromLat)) || !Number.isFinite(Number(fromLon))) {
    return { distance: 0, minutes: 0 };
  }

  const distance = calculateDistance(fromLat, fromLon, to.latitude, to.longitude);
  return { distance, minutes: calculateTravelTime(distance) };
}

function maxLegMinutes(duration) {
  const { tier } = parseDuration(duration);
  if (tier === '3_hours') return 150;
  if (tier === '1_day') return 240;
  return 300;
}

function desiredStopCount(duration) {
  const { tier, days } = parseDuration(duration);
  if (tier === '3_hours') return 3;
  if (tier === '1_day') return 5;
  // Multi-day: roughly 3-4 stops per day, capped so the curator stays sane.
  return Math.min(30, Math.max(6, Math.round(days * 3.3)));
}

function timeFlexLimit(totalMinutes, duration) {
  const { tier } = parseDuration(duration);
  const flex = {
    '3_hours': 1.6,
    '1_day': 1.7,
    '3_days': 1.2,
  };
  return totalMinutes * (flex[tier] || 1.3);
}

function buildStop(attraction, from, duration, index) {
  const travel = travelBetween(from, attraction);
  const visitDuration = plannedVisitDuration(attraction, duration);
  const { days } = parseDuration(duration);

  return {
    attraction,
    visitDuration,
    travelTime: travel.minutes,
    travelDistance: travel.distance,
    estimatedCost: estimateCost(attraction),
    day: days >= 2 ? Math.min(days, Math.floor(index / 3) + 1) : 1,
    timeSlot: ['morning', 'afternoon', 'evening'][index % 3],
  };
}

function tokenizeDescription(description) {
  return String(description || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4)
    .slice(0, 30);
}

function scoreCandidate({ attraction, travelTime, route, preferredRank, interests, descriptionTerms }) {
  const interestOverlap = (attraction.interests || []).filter((i) => interests.includes(i)).length;
  const haystack = [
    attraction.name,
    attraction.nameEn,
    attraction.description,
    attraction.category,
    attraction.city,
    ...(attraction.interests || []),
  ].join(' ').toLowerCase();
  const descriptionOverlap = (descriptionTerms || []).filter((term) => haystack.includes(term)).length;
  const sameRegionBonus = route.length && route[0].attraction.region === attraction.region ? 18 : 0;
  const sameCityBonus = route.length && route[route.length - 1].attraction.city === attraction.city ? 10 : 0;
  const llmBonus = preferredRank.has(attraction.id) ? Math.max(0, 12 - preferredRank.get(attraction.id)) : 0;

  return (
    (Number(attraction.rating) || 0) * 10 +
    interestOverlap * 8 +
    descriptionOverlap * 5 +
    sameRegionBonus +
    sameCityBonus +
    llmBonus -
    travelTime * 0.45
  );
}

function buildGreedySequence({ seed, pool, preferredRank, totalMinutes, budget, startLocation, duration, interests, descriptionTerms }) {
  const route = [];
  const used = new Set();
  let totalTime = 0;
  let activeVisitTime = 0;
  let totalCost = 0;
  let cursor = startLocation || null;
  const maxLeg = maxLegMinutes(duration);
  const maxTotalTime = timeFlexLimit(totalMinutes, duration);
  const targetStops = desiredStopCount(duration);

  function tryAdd(attraction) {
    const stop = buildStop(attraction, cursor, duration, route.length);
    const legAllowed = route.length === 0 || stop.travelTime <= maxLeg;
    if (!legAllowed) return false;
    if (activeVisitTime + stop.visitDuration > totalMinutes) return false;
    if (totalTime + stop.visitDuration + stop.travelTime > maxTotalTime) return false;
    if (totalCost + stop.estimatedCost > budget.max) return false;

    route.push(stop);
    used.add(attraction.id);
    totalTime += stop.visitDuration + stop.travelTime;
    activeVisitTime += stop.visitDuration;
    totalCost += stop.estimatedCost;
    cursor = {
      latitude: attraction.latitude,
      longitude: attraction.longitude,
    };
    return true;
  }

  tryAdd(seed);

  while (route.length < targetStops) {
    const next = pool
      .filter((attraction) => !used.has(attraction.id))
      .map((attraction) => {
        const travel = travelBetween(cursor, attraction);
        return {
          attraction,
          travelTime: travel.minutes,
          score: scoreCandidate({
            attraction,
            travelTime: travel.minutes,
            route,
            preferredRank,
            interests,
            descriptionTerms,
          }),
        };
      })
      .filter(({ attraction, travelTime }) => {
        if (route.length > 0 && travelTime > maxLeg) return false;
        const visitDuration = plannedVisitDuration(attraction, duration);
        const cost = estimateCost(attraction);
        return (
          activeVisitTime + visitDuration <= totalMinutes &&
          totalTime + travelTime + visitDuration <= maxTotalTime &&
          totalCost + cost <= budget.max
        );
      })
      .sort((a, b) => b.score - a.score)[0];

    if (!next || !tryAdd(next.attraction)) break;
  }

  return {
    route,
    totalTime,
    totalCost,
  };
}

function routeScore(plan, duration) {
  const ratingSum = plan.route.reduce((sum, stop) => sum + (Number(stop.attraction.rating) || 0), 0);
  const travelMinutes = plan.route.reduce((sum, stop) => sum + stop.travelTime, 0);
  const regionCount = new Set(plan.route.map((stop) => stop.attraction.region)).size;
  const targetStops = desiredStopCount(duration);

  return (
    Math.min(plan.route.length, targetStops) * 1000 +
    ratingSum * 20 -
    travelMinutes * 1.5 -
    Math.max(0, regionCount - 1) * 120
  );
}

function buildCoherentRoute({ candidates, preferredOrder, totalMinutes, budget, startLocation, duration, interests, description }) {
  const usable = candidates
    .filter((a) => estimateCost(a) <= budget.max)
    .filter(hasCoordinates);

  if (!usable.length) {
    return { route: [], totalTime: 0, totalCost: 0 };
  }

  const preferredRank = new Map(preferredOrder.map((a, index) => [a.id, index]));
  const descriptionTerms = tokenizeDescription(description);
  const regions = [...new Set(usable.map((a) => a.region).filter(Boolean))];
  const pools = [
    usable,
    ...regions.map((region) => usable.filter((a) => a.region === region)),
  ].filter((pool) => pool.length > 0);

  const plans = [];
  for (const pool of pools) {
    const seeds = [...pool]
      .sort((a, b) => {
        const aRank = preferredRank.has(a.id) ? preferredRank.get(a.id) : 999;
        const bRank = preferredRank.has(b.id) ? preferredRank.get(b.id) : 999;
        if (aRank !== bRank) return aRank - bRank;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      })
      .slice(0, 8);

    for (const seed of seeds) {
      const plan = buildGreedySequence({
        seed,
        pool,
        preferredRank,
        totalMinutes,
        budget,
        startLocation,
        duration,
        interests,
        descriptionTerms,
      });
      if (plan.route.length) plans.push(plan);
    }
  }

  return plans.sort((a, b) => routeScore(b, duration) - routeScore(a, duration))[0] ||
    { route: [], totalTime: 0, totalCost: 0 };
}

function buildHeuristicWhy(attraction, index) {
  if (index === 0) {
    return `Начинаем с ${attraction.name}: сильная точка маршрута и удобный ориентир для дальнейшего пути.`;
  }
  return `${attraction.name} логично продолжает направление и добавляет маршруту больше впечатлений без лишнего крюка.`;
}

module.exports = router;
