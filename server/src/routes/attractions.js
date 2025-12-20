const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { optionalAuth, authenticate } = require('../middleware/auth');

/**
 * GET /api/attractions
 * Get all attractions with filters
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      region,
      category,
      tourType,
      activityLevel,
      ageGroup,
      minBudget,
      maxBudget,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = {
      isActive: true,
      isDeleted: false,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Region filter
    if (region) {
      where.region = region;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Tour type filter
    if (tourType) {
      where.tourType = tourType;
    }

    // Activity level filter
    if (activityLevel) {
      where.activityLevel = activityLevel;
    }

    // Age group filter
    if (ageGroup) {
      where.ageGroups = { has: ageGroup };
    }

    // Budget filter
    if (minBudget || maxBudget) {
      if (minBudget) {
        where.budgetMax = { gte: parseInt(minBudget) };
      }
      if (maxBudget) {
        where.budgetMin = { lte: parseInt(maxBudget) };
      }
    }

    const [attractions, total] = await Promise.all([
      prisma.attraction.findMany({
        where,
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' },
        ],
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.attraction.count({ where }),
    ]);

    // Track search if user is logged in
    if (req.user && search) {
      await prisma.searchHistory.create({
        data: {
          userId: req.user.id,
          query: search,
          searchType: 'attraction',
          resultsCount: attractions.length,
        },
      });
    }

    res.json({
      attractions: attractions.map(attr => ({
        id: attr.id,
        name: attr.name,
        nameEn: attr.nameEn,
        description: attr.description,
        descriptionEn: attr.descriptionEn,
        image: attr.image,
        latitude: attr.latitude,
        longitude: attr.longitude,
        city: attr.city,
        region: attr.region,
        category: attr.category,
        tourType: attr.tourType,
        rating: attr.rating,
        ageGroups: attr.ageGroups,
        activityLevel: attr.activityLevel,
        interests: attr.interests,
        averageVisitDuration: attr.averageVisitDuration,
        budget: {
          min: attr.budgetMin || 0,
          max: attr.budgetMax || 0,
        },
        bestSeasons: attr.bestSeasons,
        difficultyLevel: attr.difficultyLevel,
        aiSummary: attr.aiSummary,
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + attractions.length < total,
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
 * GET /api/attractions/:id
 * Get single attraction
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const attraction = await prisma.attraction.findFirst({
      where: {
        id: parseInt(id),
        isActive: true,
        isDeleted: false,
      },
      include: {
        reviews: {
          where: { isDeleted: false },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!attraction) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Attraction not found',
        },
      });
    }

    res.json({
      id: attraction.id,
      name: attraction.name,
      nameEn: attraction.nameEn,
      description: attraction.description,
      descriptionEn: attraction.descriptionEn,
      longDescription: attraction.longDescription,
      longDescriptionEn: attraction.longDescriptionEn,
      image: attraction.image,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      city: attraction.city,
      region: attraction.region,
      category: attraction.category,
      tourType: attraction.tourType,
      rating: attraction.rating,
      reviewCount: attraction.reviewCount,
      ageGroups: attraction.ageGroups,
      activityLevel: attraction.activityLevel,
      interests: attraction.interests,
      averageVisitDuration: attraction.averageVisitDuration,
      budget: {
        min: attraction.budgetMin || 0,
        max: attraction.budgetMax || 0,
      },
      bestSeasons: attraction.bestSeasons,
      difficultyLevel: attraction.difficultyLevel,
      aiSummary: attraction.aiSummary,
      reviews: attraction.reviews.map(r => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        text: r.text,
        date: r.date,
      })),
    });
  } catch (error) {
    console.error('Get attraction error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch attraction',
      },
    });
  }
});

/**
 * GET /api/attractions/:id/nearby
 * Get nearby attractions
 */
router.get('/:id/nearby', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5, radius = 50 } = req.query; // radius in km

    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(id) },
    });

    if (!attraction || !attraction.latitude || !attraction.longitude) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Attraction not found or has no location',
        },
      });
    }

    // Get all attractions and calculate distance
    const allAttractions = await prisma.attraction.findMany({
      where: {
        id: { not: parseInt(id) },
        isActive: true,
        isDeleted: false,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    const nearbyAttractions = allAttractions
      .map(attr => ({
        ...attr,
        distance: calculateDistance(
          attraction.latitude,
          attraction.longitude,
          attr.latitude,
          attr.longitude
        ) / 1000, // Convert to km
      }))
      .filter(attr => attr.distance <= parseInt(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    res.json({
      nearby: nearbyAttractions.map(attr => ({
        id: attr.id,
        name: attr.name,
        image: attr.image,
        rating: attr.rating,
        distance: Math.round(attr.distance * 10) / 10,
        category: attr.category,
      })),
    });
  } catch (error) {
    console.error('Get nearby attractions error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch nearby attractions',
      },
    });
  }
});

/**
 * GET /api/attractions/search/history
 * Get user's search history
 */
router.get('/search/history', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = await prisma.searchHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { searchedAt: 'desc' },
      take: parseInt(limit),
      distinct: ['query'],
    });

    res.json({
      history: history.map(h => ({
        query: h.query,
        searchType: h.searchType,
        searchedAt: h.searchedAt,
      })),
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch search history',
      },
    });
  }
});

/**
 * DELETE /api/attractions/search/history
 * Clear search history
 */
router.delete('/search/history', authenticate, async (req, res) => {
  try {
    await prisma.searchHistory.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to clear search history',
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

module.exports = router;
