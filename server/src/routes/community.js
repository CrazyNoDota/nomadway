const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate, createPostSchema, createCommentSchema, reportSchema } = require('../middleware/validation');
const config = require('../config');

// Profanity check (simplified)
const blacklistWords = new Set(['spam', 'hate', 'scam']);

function checkProfanity(text) {
  const normalized = text.toLowerCase();
  for (const word of blacklistWords) {
    if (normalized.includes(word)) {
      return { blocked: true, severity: 'high' };
    }
  }
  return { blocked: false };
}

// Calculate popular score
function calculatePopularScore(post) {
  const ageHours = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
  const decay = Math.exp(-ageHours / 48);
  const score = (1.0 * post.likesCount) + (2.0 * post.commentsCount) + (1.5 * post.bookmarksCount);
  return score * decay;
}

/**
 * GET /api/community/feed
 * Get community feed with filters
 */
router.get('/feed', optionalAuth, async (req, res) => {
  try {
    const {
      sort = 'popular',
      location_country,
      location_city,
      category,
      tags,
      scope = 'all',
      limit = 20,
      cursor,
    } = req.query;

    const where = {
      isHidden: false,
      isDeleted: false,
    };

    // Filter by location
    if (location_country) {
      where.locationCountryCode = location_country;
    }
    if (location_city) {
      where.locationCity = location_city;
    }

    // Filter by category
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      where.category = { in: categories };
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray.map(t => t.toLowerCase()) };
    }

    // Filter by subscriptions
    if (scope === 'subscriptions' && req.user) {
      const following = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followeeId: true },
      });
      where.authorId = { in: following.map(f => f.followeeId) };
    }

    // Handle cursor pagination
    let cursorObj;
    if (cursor) {
      cursorObj = { id: cursor };
    }

    // Get posts
    let posts = await prisma.communityPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
            avatarUrl: true,
            locationCity: true,
            locationCountryCode: true,
          },
        },
        media: {
          take: 3,
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
      orderBy: sort === 'new'
        ? [{ publishedAt: 'desc' }, { id: 'desc' }]
        : [{ scorePopular: 'desc' }, { publishedAt: 'desc' }],
      take: parseInt(limit) + 1,
      ...(cursorObj && { cursor: cursorObj, skip: 1 }),
    });

    // Check for next page
    const hasMore = posts.length > parseInt(limit);
    if (hasMore) {
      posts = posts.slice(0, -1);
    }

    // Get user's likes and bookmarks
    let userLikes = new Set();
    let userBookmarks = new Set();
    
    if (req.user) {
      const likes = await prisma.like.findMany({
        where: {
          userId: req.user.id,
          entityType: 'post',
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      userLikes = new Set(likes.map(l => l.postId));

      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: req.user.id,
          postId: { in: posts.map(p => p.id) },
        },
        select: { postId: true },
      });
      userBookmarks = new Set(bookmarks.map(b => b.postId));
    }

    // Format response
    const items = posts.map(post => ({
      id: post.id,
      author: {
        id: post.author.id,
        name: post.author.displayName || post.author.fullName,
        avatar_url: post.author.avatarUrl,
        location: post.author.locationCity && post.author.locationCountryCode
          ? { city: post.author.locationCity, country_code: post.author.locationCountryCode }
          : null,
      },
      title: post.title,
      body_preview: post.body.substring(0, 150) + (post.body.length > 150 ? '...' : ''),
      media: post.media.map(m => ({
        thumb_url: m.thumbUrl || m.originalUrl,
        width: m.width,
        height: m.height,
      })),
      category: post.category,
      tags: post.tags,
      location: post.locationCity && post.locationCountryCode
        ? { city: post.locationCity, country_code: post.locationCountryCode }
        : null,
      counters: {
        likes: post._count.likes,
        comments: post._count.comments,
        bookmarks: post._count.bookmarks,
      },
      is_liked: userLikes.has(post.id),
      is_bookmarked: userBookmarks.has(post.id),
      published_at: post.publishedAt,
    }));

    res.json({
      items,
      next_cursor: hasMore ? posts[posts.length - 1].id : null,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch feed',
      },
    });
  }
});

/**
 * POST /api/community/posts
 * Create a new post
 */
router.post('/posts', authenticate, validate(createPostSchema), async (req, res) => {
  try {
    const { title, body, category, location, tags, media_ids } = req.body;

    // Check profanity
    const profanityCheck = checkProfanity(title + ' ' + body);
    if (profanityCheck.blocked && profanityCheck.severity === 'high') {
      return res.status(400).json({
        error: {
          code: 'PROFANITY_BLOCKED',
          message: 'Content contains blocked terms',
        },
      });
    }

    // Create post
    const post = await prisma.communityPost.create({
      data: {
        authorId: req.user.id,
        title: title.substring(0, 120),
        body,
        category,
        locationCity: location?.city,
        locationCountryCode: location.country_code,
        tags: (tags || []).slice(0, 5).map(t => t.toLowerCase().substring(0, 30)),
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Associate media if provided
    if (media_ids && Array.isArray(media_ids) && media_ids.length > 0) {
      await prisma.postMedia.updateMany({
        where: { id: { in: media_ids } },
        data: { postId: post.id },
      });
    }

    // Award points for creating a post
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        points: { increment: config.points.createPost },
      },
    });

    res.status(201).json({
      post_id: post.id,
      post,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create post',
      },
    });
  }
});

/**
 * GET /api/community/posts/:postId
 * Get single post
 */
router.get('/posts/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        isHidden: false,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            fullName: true,
            avatarUrl: true,
            locationCity: true,
            locationCountryCode: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
      });
    }

    // Check user interactions
    let isLiked = false;
    let isBookmarked = false;

    if (req.user) {
      const like = await prisma.like.findFirst({
        where: {
          userId: req.user.id,
          entityType: 'post',
          postId,
        },
      });
      isLiked = !!like;

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          userId_postId: {
            userId: req.user.id,
            postId,
          },
        },
      });
      isBookmarked = !!bookmark;
    }

    res.json({
      id: post.id,
      author: {
        id: post.author.id,
        name: post.author.displayName || post.author.fullName,
        avatar_url: post.author.avatarUrl,
        location: post.author.locationCity && post.author.locationCountryCode
          ? { city: post.author.locationCity, country_code: post.author.locationCountryCode }
          : null,
      },
      title: post.title,
      body: post.body,
      media: post.media.map(m => ({
        id: m.id,
        original_url: m.originalUrl,
        thumb_url: m.thumbUrl || m.originalUrl,
        width: m.width,
        height: m.height,
      })),
      category: post.category,
      tags: post.tags,
      location: post.locationCity && post.locationCountryCode
        ? { city: post.locationCity, country_code: post.locationCountryCode }
        : null,
      counters: {
        likes: post._count.likes,
        comments: post._count.comments,
        bookmarks: post._count.bookmarks,
      },
      is_liked: isLiked,
      is_bookmarked: isBookmarked,
      published_at: post.publishedAt,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch post',
      },
    });
  }
});

/**
 * DELETE /api/community/posts/:postId
 * Soft delete a post (author only)
 */
router.delete('/posts/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findFirst({
      where: {
        id: postId,
        authorId: req.user.id,
        isDeleted: false,
      },
    });

    if (!post) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
      });
    }

    // Soft delete
    await prisma.communityPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to delete post',
      },
    });
  }
});

/**
 * POST /api/community/posts/:postId/like
 * Like a post
 */
router.post('/posts/:postId/like', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    // Create like (upsert)
    await prisma.like.upsert({
      where: {
        userId_entityType_postId: {
          userId: req.user.id,
          entityType: 'post',
          postId,
        },
      },
      create: {
        userId: req.user.id,
        entityType: 'post',
        postId,
      },
      update: {},
    });

    // Update post counters
    const likesCount = await prisma.like.count({
      where: { postId, entityType: 'post' },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount },
    });

    // Award points to post author
    if (post.authorId !== req.user.id) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: {
          points: { increment: config.points.receiveLike },
        },
      });
    }

    res.json({ liked: true });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * DELETE /api/community/posts/:postId/like
 * Unlike a post
 */
router.delete('/posts/:postId/like', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.like.deleteMany({
      where: {
        userId: req.user.id,
        entityType: 'post',
        postId,
      },
    });

    // Update post counters
    const likesCount = await prisma.like.count({
      where: { postId, entityType: 'post' },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount },
    });

    res.json({ liked: false });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/community/posts/:postId/bookmark
 * Bookmark a post
 */
router.post('/posts/:postId/bookmark', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.bookmark.upsert({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId,
        },
      },
      create: {
        userId: req.user.id,
        postId,
      },
      update: {},
    });

    // Update counter
    const bookmarksCount = await prisma.bookmark.count({
      where: { postId },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { bookmarksCount },
    });

    res.json({ bookmarked: true });
  } catch (error) {
    console.error('Bookmark post error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * DELETE /api/community/posts/:postId/bookmark
 * Remove bookmark
 */
router.delete('/posts/:postId/bookmark', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    await prisma.bookmark.deleteMany({
      where: {
        userId: req.user.id,
        postId,
      },
    });

    // Update counter
    const bookmarksCount = await prisma.bookmark.count({
      where: { postId },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { bookmarksCount },
    });

    res.json({ bookmarked: false });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/community/posts/:postId/comments
 * Get comments for a post
 */
router.get('/posts/:postId/comments', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, cursor } = req.query;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        isHidden: false,
        isDeleted: false,
        parentCommentId: null, // Top-level comments only
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replies: {
          where: {
            isHidden: false,
            isDeleted: false,
          },
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit) + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = comments.length > parseInt(limit);
    const items = hasMore ? comments.slice(0, -1) : comments;

    res.json({
      items: items.map(comment => ({
        id: comment.id,
        author: {
          id: comment.author.id,
          name: comment.author.displayName,
          avatar_url: comment.author.avatarUrl,
        },
        body: comment.body,
        likes: comment.likesCount,
        created_at: comment.createdAt,
        replies_count: comment._count.replies,
        replies: comment.replies.map(reply => ({
          id: reply.id,
          author: {
            id: reply.author.id,
            name: reply.author.displayName,
            avatar_url: reply.author.avatarUrl,
          },
          body: reply.body,
          likes: reply.likesCount,
          created_at: reply.createdAt,
        })),
      })),
      next_cursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/community/posts/:postId/comments
 * Add a comment to a post
 */
router.post('/posts/:postId/comments', authenticate, validate(createCommentSchema), async (req, res) => {
  try {
    const { postId } = req.params;
    const { body, parent_comment_id } = req.body;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    // Check reply depth (max 2 levels)
    if (parent_comment_id) {
      const parent = await prisma.comment.findUnique({
        where: { id: parent_comment_id },
      });

      if (!parent) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Parent comment not found' },
        });
      }

      if (parent.parentCommentId) {
        return res.status(400).json({
          error: { code: 'MAX_DEPTH', message: 'Maximum reply depth reached' },
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: req.user.id,
        parentCommentId: parent_comment_id,
        body,
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update post comment count
    const commentsCount = await prisma.comment.count({
      where: {
        postId,
        isHidden: false,
        isDeleted: false,
      },
    });

    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount },
    });

    // Award points to post author
    if (post.authorId !== req.user.id) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: {
          points: { increment: config.points.receiveComment },
        },
      });
    }

    res.status(201).json({
      comment_id: comment.id,
      comment: {
        id: comment.id,
        author: {
          id: comment.author.id,
          name: comment.author.displayName,
          avatar_url: comment.author.avatarUrl,
        },
        body: comment.body,
        created_at: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/community/posts/:postId/report
 * Report a post
 */
router.post('/posts/:postId/report', authenticate, validate(reportSchema), async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, details } = req.body;

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    await prisma.report.create({
      data: {
        reporterId: req.user.id,
        postId,
        reportedId: post.authorId,
        reason,
        details,
      },
    });

    res.json({ message: 'Report submitted' });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/community/me/bookmarks
 * Get user's bookmarked posts
 */
router.get('/me/bookmarks', authenticate, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            media: {
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      items: bookmarks
        .filter(b => !b.post.isDeleted && !b.post.isHidden)
        .map(b => ({
          id: b.post.id,
          title: b.post.title,
          body_preview: b.post.body.substring(0, 100),
          author: b.post.author,
          media: b.post.media[0],
          bookmarked_at: b.createdAt,
        })),
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

module.exports = router;
