const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate, addToCartSchema, updateCartItemSchema } = require('../middleware/validation');

/**
 * GET /api/cart
 * Get user's cart items
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
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
            averageVisitDuration: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Calculate totals
    const summary = cartItems.reduce(
      (acc, item) => {
        const avgPrice = ((item.attraction.budgetMin || 0) + (item.attraction.budgetMax || 0)) / 2;
        const itemTotal = avgPrice * item.paxCount;
        acc.totalItems += item.paxCount;
        acc.totalCost += itemTotal;
        return acc;
      },
      { totalItems: 0, totalCost: 0 }
    );

    res.json({
      items: cartItems.map((item) => ({
        id: item.id,
        attractionId: item.attractionId,
        itemType: item.itemType,
        paxCount: item.paxCount,
        selectedDate: item.selectedDate,
        notes: item.notes,
        addedAt: item.addedAt,
        attraction: item.attraction,
        estimatedCost: ((item.attraction.budgetMin || 0) + (item.attraction.budgetMax || 0)) / 2 * item.paxCount,
      })),
      summary: {
        totalItems: summary.totalItems,
        totalCost: Math.round(summary.totalCost),
        itemCount: cartItems.length,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch cart',
      },
    });
  }
});

/**
 * POST /api/cart
 * Add item to cart
 */
router.post('/', authenticate, validate(addToCartSchema), async (req, res) => {
  try {
    const { attractionId, itemType, paxCount, selectedDate, notes } = req.body;

    // Check if attraction exists
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
    });

    if (!attraction) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Attraction not found',
        },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_attractionId_itemType: {
          userId: req.user.id,
          attractionId,
          itemType,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update pax count
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          paxCount: existingItem.paxCount + paxCount,
          selectedDate: selectedDate ? new Date(selectedDate) : existingItem.selectedDate,
          notes: notes || existingItem.notes,
        },
        include: {
          attraction: true,
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          attractionId,
          itemType,
          paxCount,
          selectedDate: selectedDate ? new Date(selectedDate) : null,
          notes,
        },
        include: {
          attraction: true,
        },
      });
    }

    res.status(existingItem ? 200 : 201).json({
      message: existingItem ? 'Cart item updated' : 'Added to cart',
      item: cartItem,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: {
        code: 'ADD_FAILED',
        message: 'Failed to add item to cart',
      },
    });
  }
});

/**
 * PUT /api/cart/:itemId
 * Update cart item
 */
router.put('/:itemId', authenticate, validate(updateCartItemSchema), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { paxCount, selectedDate, notes } = req.body;

    // Check if item belongs to user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: req.user.id,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cart item not found',
        },
      });
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        ...(paxCount !== undefined && { paxCount }),
        ...(selectedDate !== undefined && { selectedDate: new Date(selectedDate) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        attraction: true,
      },
    });

    res.json({
      message: 'Cart item updated',
      item: cartItem,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update cart item',
      },
    });
  }
});

/**
 * DELETE /api/cart/:itemId
 * Remove item from cart
 */
router.delete('/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if item belongs to user
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId: req.user.id,
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cart item not found',
        },
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to remove cart item',
      },
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', authenticate, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id },
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: {
        code: 'CLEAR_FAILED',
        message: 'Failed to clear cart',
      },
    });
  }
});

/**
 * POST /api/cart/sync
 * Sync local cart with server (for merging after login)
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
      if (!item.attractionId || !item.itemType) continue;

      // Check if attraction exists
      const attraction = await prisma.attraction.findUnique({
        where: { id: item.attractionId },
      });

      if (!attraction) continue;

      // Upsert cart item
      const cartItem = await prisma.cartItem.upsert({
        where: {
          userId_attractionId_itemType: {
            userId: req.user.id,
            attractionId: item.attractionId,
            itemType: item.itemType || 'attraction',
          },
        },
        update: {
          paxCount: {
            increment: item.paxCount || 1,
          },
        },
        create: {
          userId: req.user.id,
          attractionId: item.attractionId,
          itemType: item.itemType || 'attraction',
          paxCount: item.paxCount || 1,
          notes: item.notes,
        },
        include: {
          attraction: true,
        },
      });

      syncedItems.push(cartItem);
    }

    res.json({
      message: 'Cart synced successfully',
      syncedCount: syncedItems.length,
      items: syncedItems,
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({
      error: {
        code: 'SYNC_FAILED',
        message: 'Failed to sync cart',
      },
    });
  }
});

module.exports = router;
