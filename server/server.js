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

// System prompt for NomadWay context
const SYSTEM_PROMPT = `You are an AI assistant integrated into the NomadWay project.

NomadWay is a platform about exploring places, culture, and travel routes in Kazakhstan and beyond.

Always answer in a helpful, concise, and context-aware way. Provide travel advice, recommendations for places to visit, cultural insights, and route suggestions related to Kazakhstan and Central Asia.

Keep responses concise and informative.`;

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
  ageGroup, // 'family', 'adults'
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NomadWay AI Chat API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set in environment variables');
  }
});

