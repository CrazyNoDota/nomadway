const { z } = require('zod');

/**
 * Validation Middleware Factory
 * Creates middleware that validates request body against a Zod schema
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {});
        
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            fields: errors,
          },
        });
      }
      
      // Replace body with parsed data (includes defaults and transforms)
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
  };
}

/**
 * Validate query parameters
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {});
        
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fields: errors,
          },
        });
      }
      
      req.query = result.data;
      next();
    } catch (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }
  };
}

// ================== AUTH SCHEMAS ==================

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  displayName: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountryCode: z.string().length(2).optional(),
});

// ================== CART SCHEMAS ==================

const addToCartSchema = z.object({
  attractionId: z.number().int().positive(),
  itemType: z.enum(['attraction', 'tour', 'transfer']).default('attraction'),
  paxCount: z.number().int().min(1).max(50).default(1),
  selectedDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

const updateCartItemSchema = z.object({
  paxCount: z.number().int().min(1).max(50).optional(),
  selectedDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// ================== COMMUNITY SCHEMAS ==================

const createPostSchema = z.object({
  title: z.string().min(5).max(120),
  body: z.string().min(10).max(10000),
  category: z.enum(['question', 'experience', 'guide', 'seek_travel_mates', 'recommendations']),
  tags: z.array(z.string().max(30)).max(5).optional(),
  location: z.object({
    city: z.string().max(100).nullish(),
    country_code: z.string().length(2),
  }),
  media_ids: z.array(z.string()).max(10).nullish(),
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  parent_comment_id: z.string().optional(),
});

const reportSchema = z.object({
  reason: z.string().min(5).max(500),
  details: z.string().max(2000).optional(),
});

// ================== ROUTE BUILDER SCHEMAS ==================

const buildRouteSchema = z.object({
  duration: z.enum(['3_hours', '1_day', '3_days']),
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }),
  interests: z.array(z.string()).min(1),
  activityLevel: z.enum(['easy', 'moderate', 'intense']),
  ageGroup: z.enum(['family', 'young', 'adults']),
  startLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// ================== GAMIFICATION SCHEMAS ==================

const checkInSchema = z.object({
  placeId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// ================== ADMIN SCHEMAS ==================

const createAttractionSchema = z.object({
  name: z.string().min(2).max(200),
  nameEn: z.string().max(200).optional(),
  description: z.string().min(10),
  descriptionEn: z.string().optional(),
  longDescription: z.string().optional(),
  longDescriptionEn: z.string().optional(),
  image: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  city: z.string().max(100).optional(),
  region: z.enum(['south', 'north', 'east', 'west', 'central']).optional(),
  category: z.string().max(50).optional(),
  tourType: z.string().max(50).optional(),
  ageGroups: z.array(z.string()).optional(),
  activityLevel: z.enum(['easy', 'moderate', 'intense']).optional(),
  interests: z.array(z.string()).optional(),
  averageVisitDuration: z.number().int().positive().optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  bestSeasons: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
});

const updateAttractionSchema = createAttractionSchema.partial();

const moderatePostSchema = z.object({
  action: z.enum(['hide', 'unhide', 'delete']),
  reason: z.string().max(500).optional(),
});

module.exports = {
  validate,
  validateQuery,
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  // Cart
  addToCartSchema,
  updateCartItemSchema,
  // Community
  createPostSchema,
  createCommentSchema,
  reportSchema,
  // Routes
  buildRouteSchema,
  // Gamification
  checkInSchema,
  // Admin
  createAttractionSchema,
  updateAttractionSchema,
  moderatePostSchema,
};
