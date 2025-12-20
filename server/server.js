const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Load attractions data
const attractionsPath = path.join(__dirname, '../data/attractions.json');
let attractionsData = { attractions: [] };
try {
  const data = fs.readFileSync(attractionsPath, 'utf8');
  attractionsData = JSON.parse(data);
} catch (error) {
  console.error('Error loading attractions data:', error);
}

// System prompt for NomadWay context - NomadsWay AI Persona
const SYSTEM_PROMPT = `You are the intelligent travel assistant for NomadsWay, a mobile app specializing in tourism across Kazakhstan.

**Your Mission:** Assist users in selecting tours, creating custom itineraries, explaining regional nuances, and managing travel logistics based on their budget, season, departure city, and personal interests.

**Guidelines:**
1. **Tone:** Be friendly, expert, encouraging, and concise. Speak like a knowledgeable local who loves sharing Kazakhstan's beauty.
2. **Output:** Provide clear, useful answers. Avoid fluff. Be specific with prices (in Tenge), distances, and timeframes.
3. **Proactivity:** Always suggest:
   - Alternative tours if the primary choice isn't perfect
   - Add-on services (transfers, guides, equipment rental)
   - Better timing or seasonal recommendations
   - Money-saving tips or group discount opportunities
4. **Knowledge:** You are an expert on Kazakhstan geography, culture, and logistics:
   - Regions: South (Almaty, Turkestan), North (Astana, Burabay, Kostanay), East (Altai, Alakol), West (Mangystau, Aktau), Central
   - Tour types: Mountain/Alpine, Cultural/Ethno, Nature/Landscape, Historical/Pilgrimage, Adventure/Active
   - Seasons: Best times to visit different regions
   - Logistics: Transport options, accommodation, visa requirements
5. **Language:** Respond in Russian when the user writes in Russian, in English when they write in English.
6. **Cart Optimization:** When analyzing a user's cart, check for:
   - Better price-to-value alternatives
   - Group or seasonal discounts
   - Logical travel sequencing (don't suggest back-to-back tours in opposite ends of the country)
   - Budget-friendly alternatives if total is high
7. **Route Building:** When creating itineraries:
   - Include day-by-day schedules with morning/afternoon/evening activities
   - Add logistics (transport between points)
   - Estimate daily and total costs
   - Suggest gear or preparation tips
8. **Review Summarization:** When analyzing reviews, summarize top 3 Pros and top 3 Cons concisely.

Available destinations include: Charyn Canyon, Borovoe/Burabay, Turkestan, Kaindy Lake, Almaty, Khan Tengri, Medeu, Kolsai Lakes, Mangystau (Bozzhira, Sherkala), Altai, Bayanaul, Alakol, Balkhash, Zerenda, Astana, Ereymentau, Kostanay, Petropavlovsk, and more.

Remember: You are here to make Kazakhstan travel accessible, exciting, and memorable for every traveler!`;


// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Helper function to calculate travel time (simplified)
function calculateTravelTime(distance) {
  // Assuming average speed of 40 km/h for mixed transport
  const speedMetersPerMinute = 40000 / 60;
  return Math.round(distance / speedMetersPerMinute);
}

// AI Route Builder endpoint
app.post('/api/routes/build', async (req, res) => {
  try {
    const {
      duration, // '3_hours', '1_day', '3_days'
      budget,   // { min, max }
      interests, // ['food', 'nature', 'museums', etc.]
      activityLevel, // 'easy', 'moderate', 'intense'
      ageGroup, // 'family', 'young', 'adults'
      startLocation, // { latitude, longitude } optional
    } = req.body;

    // Validate input
    if (!duration || !budget || !interests || !activityLevel || !ageGroup) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Duration in minutes
    const durationMap = {
      '3_hours': 180,
      '1_day': 480,
      '3_days': 1440,
    };
    const totalMinutes = durationMap[duration] || 180;

    // Filter attractions based on criteria
    let filteredAttractions = attractionsData.attractions.filter(attr => {
      // Age group match
      if (!attr.ageGroups || !attr.ageGroups.includes(ageGroup)) return false;
      
      // Activity level match
      if (activityLevel === 'easy' && attr.activityLevel === 'intense') return false;
      if (activityLevel === 'moderate' && attr.activityLevel === 'intense') return false;
      
      // Interest match (at least one common interest)
      if (!attr.interests || !interests.some(i => attr.interests.includes(i))) return false;
      
      // Budget check (average of min and max should be within budget range)
      if (attr.budget) {
        const avgCost = (attr.budget.min + attr.budget.max) / 2;
        if (avgCost < budget.min || avgCost > budget.max) return false;
      }
      
      return true;
    });

    // Sort by rating if we have too many
    filteredAttractions.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Build route with time constraints
    let route = [];
    let totalTime = 0;
    let totalCost = 0;
    let lastLocation = startLocation;

    for (const attraction of filteredAttractions) {
      const visitTime = attraction.averageVisitDuration || 60;
      let travelTime = 0;

      if (lastLocation) {
        const distance = calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          attraction.latitude,
          attraction.longitude
        );
        travelTime = calculateTravelTime(distance);
      }

      const attractionCost = attraction.budget 
        ? (attraction.budget.min + attraction.budget.max) / 2 
        : 0;

      // Check if we can fit this attraction
      if (totalTime + visitTime + travelTime <= totalMinutes && 
          totalCost + attractionCost <= budget.max) {
        
        route.push({
          attraction: attraction,
          visitDuration: visitTime,
          travelTime: travelTime,
          travelDistance: lastLocation ? calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            attraction.latitude,
            attraction.longitude
          ) : 0,
          estimatedCost: attractionCost,
        });

        totalTime += visitTime + travelTime;
        totalCost += attractionCost;
        lastLocation = { latitude: attraction.latitude, longitude: attraction.longitude };
      }

      // Stop if we've filled the time
      if (totalTime >= totalMinutes * 0.9) break; // Use 90% of available time
    }

    // Generate alternatives for each stop
    const routeWithAlternatives = route.map((stop, index) => {
      const alternatives = filteredAttractions
        .filter(attr => 
          attr.id !== stop.attraction.id &&
          !route.some(r => r.attraction.id === attr.id) &&
          attr.category === stop.attraction.category
        )
        .slice(0, 2);
      
      return {
        ...stop,
        alternatives: alternatives.map(alt => ({
          id: alt.id,
          name: alt.name,
          description: alt.description,
          rating: alt.rating,
          estimatedCost: alt.budget ? (alt.budget.min + alt.budget.max) / 2 : 0,
        })),
      };
    });

    res.json({
      route: routeWithAlternatives,
      summary: {
        totalDuration: totalTime,
        totalCost: Math.round(totalCost),
        numberOfStops: route.length,
        ageGroup: ageGroup,
        activityLevel: activityLevel,
      },
    });

  } catch (error) {
    console.error('Error in /api/routes/build:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array with system prompt and conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Check if streaming is requested
    const stream = req.body.stream || false;

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages,
        max_tokens: parseInt(process.env.MAX_TOKENS || '512'),
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: messages,
        max_tokens: parseInt(process.env.MAX_TOKENS || '512'),
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;

      res.json({
        response,
        usage: completion.usage,
      });
    }
  } catch (error) {
    console.error('Error in /api/chat:', error);
    
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: error.response.data?.error?.message || 'OpenAI API error',
      });
    } else {
      res.status(500).json({
        error: error.message || 'Internal server error',
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NomadWay AI Chat API' });
});

// ===== GAMIFICATION ENDPOINTS =====

// In-memory storage for gamification (in production, use a database)
let userProgress = {}; // userId -> { points, achievements, visits, etc. }
let leaderboard = {}; // ageGroup -> sorted array of users

// Initialize or get user progress
function getUserProgress(userId) {
  if (!userProgress[userId]) {
    userProgress[userId] = {
      userId,
      points: 0,
      achievements: [],
      placesVisited: [],
      citiesVisited: [],
      distanceWalked: 0,
      routesCompleted: 0,
      createdAt: new Date().toISOString(),
    };
  }
  return userProgress[userId];
}

// Check-in at a place
app.post('/api/gamification/checkin', (req, res) => {
  try {
    const { userId, placeId, placeName, city, ageGroup } = req.body;

    if (!userId || !placeId) {
      return res.status(400).json({ error: 'userId and placeId are required' });
    }

    const progress = getUserProgress(userId);
    
    // Add place if not already visited
    if (!progress.placesVisited.some(p => p.id === placeId)) {
      progress.placesVisited.push({
        id: placeId,
        name: placeName,
        visitedAt: new Date().toISOString(),
      });
      progress.points += 20; // POINTS.VISIT_PLACE
    }

    // Add city if not already visited
    if (city && !progress.citiesVisited.includes(city)) {
      progress.citiesVisited.push(city);
    }

    // Check for new achievements
    const newAchievements = checkAchievements(progress, ageGroup);

    res.json({
      success: true,
      pointsEarned: 20,
      totalPoints: progress.points,
      newAchievements,
    });

  } catch (error) {
    console.error('Error in /api/gamification/checkin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user progress
app.get('/api/gamification/progress/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const progress = getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error in /api/gamification/progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
app.get('/api/gamification/leaderboard', (req, res) => {
  try {
    const { ageGroup, period = 'all_time' } = req.query;

    // Convert userProgress to array and sort by points
    let users = Object.values(userProgress);

    // Filter by age group if specified
    if (ageGroup && ageGroup !== 'all') {
      users = users.filter(u => u.ageGroup === ageGroup);
    }

    // Sort by points
    users.sort((a, b) => b.points - a.points);

    // Take top 100
    const topUsers = users.slice(0, 100).map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      username: user.username || `User ${user.userId.substring(0, 8)}`,
      points: user.points,
      achievements: user.achievements.length,
      ageGroup: user.ageGroup,
    }));

    res.json({
      leaderboard: topUsers,
      period,
      ageGroup: ageGroup || 'all',
    });

  } catch (error) {
    console.error('Error in /api/gamification/leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/gamification/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { username, ageGroup, avatar } = req.body;

    const progress = getUserProgress(userId);
    
    if (username) progress.username = username;
    if (ageGroup) progress.ageGroup = ageGroup;
    if (avatar) progress.avatar = avatar;

    res.json(progress);

  } catch (error) {
    console.error('Error in /api/gamification/profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check achievements
function checkAchievements(progress, ageGroup) {
  const newAchievements = [];
  
  // Define achievements (simplified version)
  const achievements = [
    { id: 'explorer_beginner', threshold: 5, type: 'places', points: 50 },
    { id: 'explorer_intermediate', threshold: 10, type: 'places', points: 100 },
    { id: 'explorer_expert', threshold: 25, type: 'places', points: 250 },
    { id: 'city_explorer', threshold: 3, type: 'cities', points: 150 },
    { id: 'city_master', threshold: 5, type: 'cities', points: 300 },
    { id: 'walker_bronze', threshold: 10000, type: 'distance', points: 100 },
    { id: 'walker_silver', threshold: 50000, type: 'distance', points: 250 },
    { id: 'walker_gold', threshold: 100000, type: 'distance', points: 500 },
  ];

  for (const achievement of achievements) {
    // Skip if already earned
    if (progress.achievements.includes(achievement.id)) continue;

    let earned = false;

    if (achievement.type === 'places') {
      earned = progress.placesVisited.length >= achievement.threshold;
    } else if (achievement.type === 'cities') {
      earned = progress.citiesVisited.length >= achievement.threshold;
    } else if (achievement.type === 'distance') {
      earned = progress.distanceWalked >= achievement.threshold;
    }

    if (earned) {
      progress.achievements.push(achievement.id);
      progress.points += achievement.points;
      newAchievements.push({
        id: achievement.id,
        points: achievement.points,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  return newAchievements;
}

// ===== COMMUNITY MODULE ENDPOINTS =====

// In-memory storage for community (in production, use a database)
let posts = {}; // postId -> post object
let comments = {}; // commentId -> comment object
let postMedia = {}; // mediaId -> media object
let likes = {}; // userId -> Set of {entityType, entityId}
let bookmarks = {}; // userId -> Set of postIds
let follows = {}; // followerId -> Set of followeeIds
let reports = {}; // reportId -> report object
let blocks = {}; // blockerId -> Set of blockedIds
let notifications = {}; // userId -> array of notifications
let users = {}; // userId -> user profile
let blacklistWords = new Set(['spam', 'hate']); // Simplified blacklist

// Helper: Generate ULID-like ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper: Get or create user
function getOrCreateUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      display_name: `User ${userId.substring(0, 8)}`,
      avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      location_city: null,
      location_country_code: null,
      bio: null,
      privacy_location_precision: 'city',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return users[userId];
}

// Helper: Check if user is blocked
function isBlocked(viewerId, targetId) {
  return blocks[viewerId]?.has(targetId) || blocks[targetId]?.has(viewerId);
}

// Helper: Filter blocked content
function filterBlockedContent(items, viewerId) {
  if (!viewerId) return items;
  return items.filter(item => {
    const authorId = item.author_id || item.author?.id;
    return !isBlocked(viewerId, authorId);
  });
}

// Helper: Calculate popular score
function calculatePopularScore(post) {
  let likesCount = 0;
  for (const userId in likes) {
    if (likes[userId].has(`post:${post.id}`)) {
      likesCount++;
    }
  }
  
  const commentsCount = Object.values(comments).filter(c => c.post_id === post.id && !c.is_hidden).length;
  
  let bookmarksCount = 0;
  for (const userId in bookmarks) {
    if (bookmarks[userId].has(post.id)) {
      bookmarksCount++;
    }
  }
  
  const ageHours = (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60);
  const decay = Math.exp(-ageHours / 48); // 48h half-life
  
  const score = (1.0 * likesCount) + (2.0 * commentsCount) + (1.5 * bookmarksCount);
  return score * decay;
}

// Helper: Check profanity (simplified)
function checkProfanity(text) {
  const normalized = text.toLowerCase();
  for (const word of blacklistWords) {
    if (normalized.includes(word)) {
      return { blocked: true, severity: 'high' };
    }
  }
  return { blocked: false };
}

// Helper: Create cursor for pagination
function createCursor(sortField, id) {
  return Buffer.from(`${sortField}:${id}`).toString('base64');
}

// Helper: Parse cursor
function parseCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [sortField, id] = decoded.split(':');
    return { sortField, id };
  } catch {
    return null;
  }
}

// GET /api/v1/community/feed
app.get('/api/v1/community/feed', (req, res) => {
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
    
    const viewerId = req.headers['x-user-id'] || null; // In production, extract from JWT
    
    let postList = Object.values(posts).filter(p => !p.is_hidden);
    
    // Filter by location
    if (location_country) {
      postList = postList.filter(p => p.location_country_code === location_country);
    }
    if (location_city) {
      postList = postList.filter(p => p.location_city === location_city);
    }
    
    // Filter by category
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      postList = postList.filter(p => categories.includes(p.category));
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      postList = postList.filter(p => {
        const postTags = p.tags || [];
        return tagArray.some(tag => postTags.includes(tag.toLowerCase()));
      });
    }
    
    // Filter by scope (subscriptions)
    if (scope === 'subscriptions' && viewerId) {
      const following = follows[viewerId] || new Set();
      postList = postList.filter(p => following.has(p.author_id));
    }
    
    // Filter blocked content
    postList = filterBlockedContent(postList, viewerId);
    
    // Sort
    if (sort === 'popular') {
      postList.forEach(p => {
        p.score_popular = calculatePopularScore(p);
      });
      postList.sort((a, b) => {
        if (b.score_popular !== a.score_popular) {
          return b.score_popular - a.score_popular;
        }
        return new Date(b.published_at) - new Date(a.published_at);
      });
    } else if (sort === 'new') {
      postList.sort((a, b) => {
        if (new Date(b.published_at) - new Date(a.published_at) !== 0) {
          return new Date(b.published_at) - new Date(a.published_at);
        }
        return b.id.localeCompare(a.id);
      });
    }
    
    // Pagination
    let startIndex = 0;
    if (cursor) {
      const parsed = parseCursor(cursor);
      if (parsed) {
        const cursorIndex = postList.findIndex(p => p.id === parsed.id);
        if (cursorIndex >= 0) {
          startIndex = cursorIndex + 1;
        }
      }
    }
    
    const paginatedPosts = postList.slice(startIndex, startIndex + parseInt(limit));
    
    // Format response
    const items = paginatedPosts.map(post => {
      const author = getOrCreateUser(post.author_id);
      const media = Object.values(postMedia).filter(m => m.post_id === post.id);
      const isLiked = viewerId && likes[viewerId]?.has(`post:${post.id}`);
      const isBookmarked = viewerId && bookmarks[viewerId]?.has(post.id);
      
      let likesCount = 0;
      for (const userId in likes) {
        if (likes[userId].has(`post:${post.id}`)) {
          likesCount++;
        }
      }
      
      const commentsCount = Object.values(comments).filter(c => c.post_id === post.id && !c.is_hidden).length;
      
      let bookmarksCount = 0;
      for (const userId in bookmarks) {
        if (bookmarks[userId].has(post.id)) {
          bookmarksCount++;
        }
      }
      
      return {
        id: post.id,
        author: {
          id: author.id,
          name: author.display_name,
          avatar_url: author.avatar_url,
          location: author.location_city && author.location_country_code
            ? { city: author.location_city, country_code: author.location_country_code }
            : null,
        },
        title: post.title,
        body_preview: post.body.substring(0, 150) + (post.body.length > 150 ? '...' : ''),
        media: media.slice(0, 3).map(m => ({
          thumb_url: m.thumb_url || m.original_url,
          width: m.width,
          height: m.height,
        })),
        category: post.category,
        tags: post.tags || [],
        location: post.location_city && post.location_country_code
          ? { city: post.location_city, country_code: post.location_country_code }
          : null,
        counters: {
          likes: likesCount,
          comments: commentsCount,
          bookmarks: bookmarksCount,
        },
        is_liked: isLiked || false,
        is_bookmarked: isBookmarked || false,
        published_at: post.published_at,
      };
    });
    
    const nextCursor = paginatedPosts.length === parseInt(limit) && postList.length > startIndex + parseInt(limit)
      ? createCursor(sort === 'popular' ? postList[startIndex + parseInt(limit) - 1].score_popular : postList[startIndex + parseInt(limit) - 1].published_at, postList[startIndex + parseInt(limit) - 1].id)
      : null;
    
    res.json({
      items,
      next_cursor: nextCursor,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in /api/v1/community/feed:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  }
});

// POST /api/v1/community/posts
app.post('/api/v1/community/posts', (req, res) => {
  try {
    const { title, body, category, location, tags, media_ids } = req.body;
    const authorId = req.headers['x-user-id'] || generateId(); // In production, extract from JWT
    
    // Validation
    if (!title || title.length > 120) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required and must be ≤ 120 characters',
          fields: { title: title ? 'Must be ≤ 120 characters' : 'Required' },
        },
      });
    }
    
    if (!body || body.length < 10) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Body is required and must be ≥ 10 characters',
          fields: { body: body ? 'Must be ≥ 10 characters' : 'Required' },
        },
      });
    }
    
    if (!category || !['question', 'experience', 'guide', 'seek_travel_mates', 'recommendations'].includes(category)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid category is required',
          fields: { category: 'Required' },
        },
      });
    }
    
    if (!location || !location.country_code) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Location with country_code is required',
          fields: { location: 'Required' },
        },
      });
    }
    
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
    const postId = generateId();
    const now = new Date().toISOString();
    
    posts[postId] = {
      id: postId,
      author_id: authorId,
      title: title.substring(0, 120),
      body,
      category,
      location_city: location.city || null,
      location_country_code: location.country_code,
      tags: (tags || []).slice(0, 5).map(t => t.toLowerCase().substring(0, 30)),
      is_hidden: false,
      hidden_reason: null,
      score_popular: 0,
      published_at: now,
      created_at: now,
      updated_at: now,
    };
    
    // Associate media
    if (media_ids && Array.isArray(media_ids)) {
      media_ids.forEach((mediaId, index) => {
        if (postMedia[mediaId]) {
          postMedia[mediaId].post_id = postId;
          postMedia[mediaId].order_index = index;
        }
      });
    }
    
    res.json({
      post_id: postId,
      trace_id: generateId(),
      server_time: now,
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/posts:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  }
});

// GET /api/v1/community/posts/:postId
app.get('/api/v1/community/posts/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const viewerId = req.headers['x-user-id'] || null;
    
    const post = posts[postId];
    if (!post || post.is_hidden) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Post not found',
        },
      });
    }
    
    // Check if blocked
    if (viewerId && isBlocked(viewerId, post.author_id)) {
      return res.status(403).json({
        error: {
          code: 'BLOCKED',
          message: 'Content not available',
        },
      });
    }
    
    const author = getOrCreateUser(post.author_id);
    const media = Object.values(postMedia)
      .filter(m => m.post_id === postId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    const isLiked = viewerId && likes[viewerId]?.has(`post:${postId}`);
    const isBookmarked = viewerId && bookmarks[viewerId]?.has(postId);
    
    let likesCount = 0;
    for (const userId in likes) {
      if (likes[userId].has(`post:${postId}`)) {
        likesCount++;
      }
    }
    
    const commentsCount = Object.values(comments).filter(c => c.post_id === postId && !c.is_hidden).length;
    
    let bookmarksCount = 0;
    for (const userId in bookmarks) {
      if (bookmarks[userId].has(postId)) {
        bookmarksCount++;
      }
    }
    
    res.json({
      id: post.id,
      author: {
        id: author.id,
        name: author.display_name,
        avatar_url: author.avatar_url,
        location: author.location_city && author.location_country_code
          ? { city: author.location_city, country_code: author.location_country_code }
          : null,
      },
      title: post.title,
      body: post.body,
      media: media.map(m => ({
        id: m.id,
        original_url: m.original_url,
        thumb_url: m.thumb_url || m.original_url,
        width: m.width,
        height: m.height,
      })),
      category: post.category,
      tags: post.tags || [],
      location: post.location_city && post.location_country_code
        ? { city: post.location_city, country_code: post.location_country_code }
        : null,
      counters: {
        likes: likesCount,
        comments: commentsCount,
        bookmarks: bookmarksCount,
      },
      is_liked: isLiked || false,
      is_bookmarked: isBookmarked || false,
      published_at: post.published_at,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in GET /api/v1/community/posts/:postId:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  }
});

// POST /api/v1/community/posts/:postId/like
app.post('/api/v1/community/posts/:postId/like', (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (!posts[postId]) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }
    
    if (!likes[userId]) {
      likes[userId] = new Set();
    }
    
    const likeKey = `post:${postId}`;
    const wasLiked = likes[userId].has(likeKey);
    
    if (!wasLiked) {
      likes[userId].add(likeKey);
    }
    
    res.json({
      liked: true,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/posts/:postId/like:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// DELETE /api/v1/community/posts/:postId/like
app.delete('/api/v1/community/posts/:postId/like', (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (likes[userId]) {
      likes[userId].delete(`post:${postId}`);
    }
    
    res.json({
      liked: false,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/v1/community/posts/:postId/like:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/community/posts/:postId/bookmark
app.post('/api/v1/community/posts/:postId/bookmark', (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (!posts[postId]) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }
    
    if (!bookmarks[userId]) {
      bookmarks[userId] = new Set();
    }
    
    bookmarks[userId].add(postId);
    
    res.json({
      bookmarked: true,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/posts/:postId/bookmark:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// DELETE /api/v1/community/posts/:postId/bookmark
app.delete('/api/v1/community/posts/:postId/bookmark', (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (bookmarks[userId]) {
      bookmarks[userId].delete(postId);
    }
    
    res.json({
      bookmarked: false,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/v1/community/posts/:postId/bookmark:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// GET /api/v1/community/posts/:postId/comments
app.get('/api/v1/community/posts/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, cursor } = req.query;
    const viewerId = req.headers['x-user-id'] || null;
    
    let commentList = Object.values(comments)
      .filter(c => c.post_id === postId && !c.is_hidden && !c.parent_comment_id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Pagination
    let startIndex = 0;
    if (cursor) {
      const parsed = parseCursor(cursor);
      if (parsed) {
        const cursorIndex = commentList.findIndex(c => c.id === parsed.id);
        if (cursorIndex >= 0) {
          startIndex = cursorIndex + 1;
        }
      }
    }
    
    const paginatedComments = commentList.slice(startIndex, startIndex + parseInt(limit));
    
    const items = paginatedComments.map(comment => {
      const author = getOrCreateUser(comment.author_id);
      const replies = Object.values(comments)
        .filter(c => c.parent_comment_id === comment.id && !c.is_hidden)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(0, 3)
        .map(reply => {
          const replyAuthor = getOrCreateUser(reply.author_id);
          const isLiked = viewerId && likes[viewerId]?.has(`comment:${reply.id}`);
          let likesCount = 0;
          for (const userId in likes) {
            if (likes[userId].has(`comment:${reply.id}`)) {
              likesCount++;
            }
          }
          
          return {
            id: reply.id,
            author: {
              id: replyAuthor.id,
              name: replyAuthor.display_name,
              avatar_url: replyAuthor.avatar_url,
            },
            body: reply.body,
            parent_comment_id: reply.parent_comment_id,
            likes: likesCount,
            is_liked: isLiked || false,
            created_at: reply.created_at,
          };
        });
      
      const isLiked = viewerId && likes[viewerId]?.has(`comment:${comment.id}`);
      let likesCount = 0;
      for (const userId in likes) {
        if (likes[userId].has(`comment:${comment.id}`)) {
          likesCount++;
        }
      }
      
      const repliesCount = Object.values(comments).filter(c => c.parent_comment_id === comment.id && !c.is_hidden).length;
      
      return {
        id: comment.id,
        author: {
          id: author.id,
          name: author.display_name,
          avatar_url: author.avatar_url,
        },
        body: comment.body,
        parent_comment_id: null,
        likes: likesCount,
        is_liked: isLiked || false,
        created_at: comment.created_at,
        replies_count: repliesCount,
        replies: replies,
      };
    });
    
    const nextCursor = paginatedComments.length === parseInt(limit) && commentList.length > startIndex + parseInt(limit)
      ? createCursor(commentList[startIndex + parseInt(limit) - 1].created_at, commentList[startIndex + parseInt(limit) - 1].id)
      : null;
    
    res.json({
      items,
      next_cursor: nextCursor,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in GET /api/v1/community/posts/:postId/comments:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/community/posts/:postId/comments
app.post('/api/v1/community/posts/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const { body, parent_comment_id } = req.body;
    const authorId = req.headers['x-user-id'] || generateId();
    
    if (!posts[postId]) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }
    
    if (!body || body.trim().length < 1) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment body is required',
          fields: { body: 'Required' },
        },
      });
    }
    
    // Check depth (max 2 levels)
    if (parent_comment_id) {
      const parent = comments[parent_comment_id];
      if (!parent) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Parent comment not found' },
        });
      }
      if (parent.parent_comment_id) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Maximum comment depth reached' },
        });
      }
    }
    
    const commentId = generateId();
    const now = new Date().toISOString();
    
    comments[commentId] = {
      id: commentId,
      post_id: req.params.postId,
      author_id: authorId,
      parent_comment_id: parent_comment_id || null,
      body: body.trim(),
      is_hidden: false,
      hidden_reason: null,
      likes_count: 0,
      created_at: now,
      updated_at: now,
    };
    
    res.json({
      comment_id: commentId,
      trace_id: generateId(),
      server_time: now,
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/posts/:postId/comments:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/community/comments/:commentId/like
app.post('/api/v1/community/comments/:commentId/like', (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (!comments[commentId]) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }
    
    if (!likes[userId]) {
      likes[userId] = new Set();
    }
    
    likes[userId].add(`comment:${commentId}`);
    
    res.json({
      liked: true,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/comments/:commentId/like:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// DELETE /api/v1/community/comments/:commentId/like
app.delete('/api/v1/community/comments/:commentId/like', (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.headers['x-user-id'] || generateId();
    
    if (likes[userId]) {
      likes[userId].delete(`comment:${commentId}`);
    }
    
    res.json({
      liked: false,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/v1/community/comments/:commentId/like:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/community/users/:userId/follow
app.post('/api/v1/community/users/:userId/follow', (req, res) => {
  try {
    const { userId: followeeId } = req.params;
    const followerId = req.headers['x-user-id'] || generateId();
    
    if (followerId === followeeId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Cannot follow yourself' },
      });
    }
    
    if (!follows[followerId]) {
      follows[followerId] = new Set();
    }
    
    follows[followerId].add(followeeId);
    
    res.json({
      following: true,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/users/:userId/follow:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// DELETE /api/v1/community/users/:userId/follow
app.delete('/api/v1/community/users/:userId/follow', (req, res) => {
  try {
    const { userId: followeeId } = req.params;
    const followerId = req.headers['x-user-id'] || generateId();
    
    if (follows[followerId]) {
      follows[followerId].delete(followeeId);
    }
    
    res.json({
      following: false,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/v1/community/users/:userId/follow:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/community/reports
app.post('/api/v1/community/reports', (req, res) => {
  try {
    const { entity_type, entity_id, reason, note } = req.body;
    const reporterId = req.headers['x-user-id'] || generateId();
    
    if (!['post', 'comment', 'user'].includes(entity_type)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid entity_type' },
      });
    }
    
    const reportId = generateId();
    const now = new Date().toISOString();
    
    reports[reportId] = {
      id: reportId,
      reporter_id: reporterId,
      entity_type,
      entity_id,
      reason,
      note: note ? note.substring(0, 300) : null,
      status: 'open',
      reviewed_by: null,
      resolution: null,
      resolved_at: null,
      created_at: now,
    };
    
    res.json({
      report_id: reportId,
      trace_id: generateId(),
      server_time: now,
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/community/reports:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// POST /api/v1/media/upload-url (simplified - returns mock URL)
app.post('/api/v1/media/upload-url', (req, res) => {
  try {
    const { mime_type, size_bytes, entity } = req.body;
    
    if (size_bytes > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'File size exceeds 10MB limit' },
      });
    }
    
    const mediaId = generateId();
    const mockUrl = `https://picsum.photos/800/600?random=${mediaId}`;
    
    postMedia[mediaId] = {
      id: mediaId,
      post_id: null,
      type: 'image',
      original_url: mockUrl,
      thumb_url: `https://picsum.photos/400/300?random=${mediaId}`,
      width: 800,
      height: 600,
      size_bytes,
      order_index: 0,
      created_at: new Date().toISOString(),
    };
    
    res.json({
      upload_url: mockUrl, // In production, return pre-signed URL
      media_id: mediaId,
      trace_id: generateId(),
      server_time: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in POST /api/v1/media/upload-url:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NomadWay AI Chat API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in environment variables');
  }
});

