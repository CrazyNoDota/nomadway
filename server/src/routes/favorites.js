const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/favorites
 * Get user's favorites
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: req.user.id },
      include: {
        attraction: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            description: true,
            descriptionEn: true,
            image: true,
            rating: true,
            budgetMin: true,
            budgetMax: true,
            city: true,
            region: true,
            category: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    res.json({
      items: favorites.map((fav) => ({
        id: fav.id,
        attractionId: fav.attractionId,
        itemType: fav.itemType,
        addedAt: fav.addedAt,
        attraction: fav.attraction,
      })),
      count: favorites.length,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch favorites',
      },
    });
  }
});

/**
 * POST /api/favorites
 * Add item to favorites
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { attractionId, itemType = 'attraction' } = req.body;

    if (!attractionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'attractionId is required',
        },
      });
    }

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: parseInt(attractionId) },
    });

    if (!attraction) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Attraction not found',
        },
      });
    }

    // Check if already in favorites
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_attractionId_itemType: {
          userId: req.user.id,
          attractionId: parseInt(attractionId),
          itemType,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Item already in favorites',
        },
      });
    }

    const favorite = await prisma.userFavorite.create({
      data: {
        userId: req.user.id,
        attractionId: parseInt(attractionId),
        itemType,
      },
      include: {
        attraction: true,
      },
    });

    res.status(201).json({
      message: 'Added to favorites',
      item: favorite,
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      error: {
        code: 'ADD_FAILED',
        message: 'Failed to add to favorites',
      },
    });
  }
});

/**
 * DELETE /api/favorites/:attractionId
 * Remove item from favorites
 */
router.delete('/:attractionId', authenticate, async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { itemType = 'attraction' } = req.query;

    const deleted = await prisma.userFavorite.deleteMany({
      where: {
        userId: req.user.id,
        attractionId: parseInt(attractionId),
        itemType,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Favorite not found',
        },
      });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to remove from favorites',
      },
    });
  }
});

/**
 * POST /api/favorites/toggle
 * Toggle favorite status
 */
router.post('/toggle', authenticate, async (req, res) => {
  try {
    const { attractionId, itemType = 'attraction' } = req.body;

    if (!attractionId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'attractionId is required',
        },
      });
    }

    // Check if already in favorites
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_attractionId_itemType: {
          userId: req.user.id,
          attractionId: parseInt(attractionId),
          itemType,
        },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.userFavorite.delete({
        where: { id: existing.id },
      });

      return res.json({
        isFavorite: false,
        message: 'Removed from favorites',
      });
    } else {
      // Add to favorites
      await prisma.userFavorite.create({
        data: {
          userId: req.user.id,
          attractionId: parseInt(attractionId),
          itemType,
        },
      });

      return res.json({
        isFavorite: true,
        message: 'Added to favorites',
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: {
        code: 'TOGGLE_FAILED',
        message: 'Failed to toggle favorite',
      },
    });
  }
});

/**
 * GET /api/favorites/check/:attractionId
 * Check if item is in favorites
 */
router.get('/check/:attractionId', authenticate, async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { itemType = 'attraction' } = req.query;

    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_attractionId_itemType: {
          userId: req.user.id,
          attractionId: parseInt(attractionId),
          itemType,
        },
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      error: {
        code: 'CHECK_FAILED',
        message: 'Failed to check favorite status',
      },
    });
  }
});

/**
 * POST /api/favorites/sync
 * Sync local favorites with server (for merging after login)
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DATA',
          message: 'Items must be an array',
        },
      });
    }

    const syncedItems = [];

    for (const item of items) {
      if (!item.attractionId) continue;

      try {
        const favorite = await prisma.userFavorite.upsert({
          where: {
            userId_attractionId_itemType: {
              userId: req.user.id,
              attractionId: parseInt(item.attractionId),
              itemType: item.itemType || 'attraction',
            },
          },
          update: {},
          create: {
            userId: req.user.id,
            attractionId: parseInt(item.attractionId),
            itemType: item.itemType || 'attraction',
          },
          include: {
            attraction: true,
          },
        });

        syncedItems.push(favorite);
      } catch (e) {
        // Skip invalid items
      }
    }

    res.json({
      message: 'Favorites synced successfully',
      syncedCount: syncedItems.length,
      items: syncedItems,
    });
  } catch (error) {
    console.error('Sync favorites error:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync favorites',
      },
    });
  }
});

module.exports = router;
