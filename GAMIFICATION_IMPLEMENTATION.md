# NomadWay App Enhancement - Implementation Guide

## 🎯 Overview
This document describes the AI-powered route building and gamification features added to the NomadWay React Native mobile application, with explicit segmentation for two user cohorts:
- �‍👩‍👧 **Family (семейный отдых)**
- 👩‍🦳 **Adults (взрослые путешественники)**

## 📁 New File Structure

### Constants
- **`constants/userSegments.js`** - User group types, activity levels, interests, and duration constants
- **`constants/gamification.js`** - Achievements, points, leaderboard definitions

### Screens
- **`screens/AIRouteBuilderScreen.js`** - AI-powered route builder interface
- **`screens/AchievementsScreen.js`** - User achievements and progress dashboard
- **`screens/LeaderboardScreen.js`** - Leaderboard with age group filtering

### Utilities
- **`utils/localization.js`** - Russian/English localization support

### Backend (Enhanced)
- **`server/server.js`** - Added route building and gamification endpoints

### Data (Enhanced)
- **`data/attractions.json`** - Enhanced with age groups, activity levels, and interests

## 🧠 AI Route Builder

### Features Implemented

#### 1. User Input Parameters
The route builder accepts the following parameters:

**Age Group Selection:**
- Family (Семейный отдых)
- Adults (Взрослые путешественники)

**Duration Options:**
- 3 hours (3 часа)
- 1 day (1 день)
- 3 days (3 дня)

**Budget Input:**
- Minimum and maximum budget in Kazakhstani Tenge (₸)

**Activity Level:**
- Easy (Лёгко)
- Moderate (Средне)
- Intense (Интенсивно)

**Interests (Multi-select):**
- Food (Еда)
- Nature (Природа)
- Museums (Музеи)
- Shopping (Шопинг)
- Adventure (Приключения)
- Culture (Культура)
- Sports (Спорт)
- Education (Образование)

#### 2. AI Route Generation Algorithm

**Backend Endpoint:** `POST /api/routes/build`

**Algorithm Steps:**
1. Filter attractions based on:
  - Age group compatibility
  - Activity level (family routes favor easy/moderate, adults can include intense)
   - Interest matching
   - Budget constraints

2. Sort filtered attractions by rating

3. Build route sequence:
   - Calculate visit duration per attraction
   - Calculate travel time between locations (Haversine formula)
   - Calculate travel distance
   - Estimate costs per stop

4. Generate alternatives for each stop (same category)

**Age-Specific Adjustments:**
- **Family:** 
  - Max walking distance: 800m
  - Average visit: 40 min
  - Rest frequency: every 75 min
  - Preferred: education, nature, culture, food
  
- **Adults:**
  - Max walking distance: 1500m
  - Average visit: 60 min
  - Rest frequency: every 90 min
  - Preferred: culture, museums, nature, food

#### 3. Route Visualization

**Map Display:**
- Uses `react-native-maps`
- Numbered markers for each stop
- Polyline connecting all stops
- Interactive markers with titles and descriptions

**Timeline View:**
- Sequential list of attractions
- Visit duration per stop
- Travel time and distance
- Estimated cost per stop
- Alternative suggestions

**Summary Card:**
- Total duration
- Total estimated cost
- Number of stops
- Age group and activity level

## 🎮 Gamification System

### Points System

**Points for Actions:**
- Visit a place: 20 points
- Complete a route: 50 points
- Share a post: 10 points
- Write a review: 15 points
- Add a photo: 5 points
- Daily login: 5 points
- Complete challenge: 100 points

### Achievements

#### Places Visited
- **Beginner Explorer** (5 places) - 50 points
- **Experienced Traveler** (10 places) - 100 points
- **Travel Master** (25 places) - 250 points

#### Cities Visited
- **City Explorer** (3 cities) - 150 points
- **City Master** (5 cities) - 300 points

#### Distance Walked
- **Bronze Walker** (10 km) - 100 points
- **Silver Walker** (50 km) - 250 points
- **Gold Walker** (100 km) - 500 points

#### Age-Specific Achievements
- **Family Explorer** (family) - 100 points
- **Cultural Guru** (adults) - 200 points
- **Adventure Seeker** (adults) - 200 points

### Seasonal Challenges

1. **Almaty Tour 2025** (Тур по Алматы 2025)
   - Visit all major Almaty attractions
   - 500 points
   - Badge: 🏔️

2. **Winter Astana Route** (Зимний маршрут Астаны)
   - Explore Astana in winter
   - 400 points
   - Badge: ❄️

3. **Spring Tulips 2025** (Тюльпаны весны 2025)
   - See tulips blooming in the steppe
   - 300 points
   - Badge: 🌷

### Leaderboard

**Filtering Options:**
- Age groups: All, Family, Adults
- Time periods: All Time, Monthly, Weekly

**Display:**
- Rank position
- Username
- Total points
- Number of achievements
- Top 3 users highlighted with medals (🥇🥈🥉)
- Current user highlighted

### Backend Endpoints

#### Check-in at a Place
```
POST /api/gamification/checkin
Body: { userId, placeId, placeName, city, ageGroup }
Returns: { success, pointsEarned, totalPoints, newAchievements }
```

#### Get User Progress
```
GET /api/gamification/progress/:userId
Returns: User progress with points, achievements, visits
```

#### Get Leaderboard
```
GET /api/gamification/leaderboard?ageGroup=family&period=all_time
Returns: { leaderboard: [...], period, ageGroup }
```

#### Update User Profile
```
PUT /api/gamification/profile/:userId
Body: { username, ageGroup, avatar }
Returns: Updated user profile
```

## 🌍 Localization

**Supported Languages:**
- Russian (ru) - Default
- English (en)

**Implementation:**
- Simple translation function `t(key)`
- Language switching via `setLanguage(lang)`
- Translations stored in `utils/localization.js`

## 📱 Navigation Structure

### New Navigation Routes

**In Stack Navigator:**
- `AIRouteBuilder` - AI Route Builder screen
- `Achievements` - Achievements dashboard
- `Leaderboard` - Leaderboard screen

**Access Points:**
- Profile screen: Gamification cards
- Profile screen: Stats row (tappable)
- Direct navigation from other screens

## 🔧 Installation & Setup

### 1. Install Dependencies

The app already has most required dependencies. Ensure you have:
- `react-native-maps` ✅ (already installed)
- `@react-native-async-storage/async-storage` ✅ (already installed)

### 2. Backend Setup

Start the server:
```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:3001`

### 3. Run the App

```bash
npm start
# Then press 'a' for Android or 'i' for iOS
```

## 🎨 Design Highlights

### Color Scheme
- Primary: `#1a4d3a` (Forest Green)
- Accent: `#d4af37` (Gold)
- Background: `#f5f5f5` (Light Gray)
- Success: `#4caf50` (Green)
- Text: `#333` (Dark Gray)

### UI Components
- Modern card-based design
- Smooth transitions and animations
- Icon-rich interface using Ionicons
- Responsive layouts for different screen sizes

## 📊 Data Structure

### Enhanced Attraction Object
```json
{
  "id": 1,
  "name": "Чарынский каньон",
  "description": "...",
  "latitude": 43.35,
  "longitude": 79.07,
  "category": "Природа",
  "rating": 4.8,
  "ageGroups": ["adults"],
  "activityLevel": "moderate",
  "interests": ["nature", "adventure"],
  "averageVisitDuration": 180,
  "budget": { "min": 2000, "max": 5000 }
}
```

### User Progress Object
```json
{
  "userId": "user_123",
  "points": 450,
  "achievements": ["explorer_beginner", "city_explorer"],
  "placesVisited": [
    { "id": 1, "name": "...", "visitedAt": "2025-11-15" }
  ],
  "citiesVisited": ["Almaty", "Astana"],
  "distanceWalked": 15000,
  "routesCompleted": 3
}
```

## 🚀 Future Enhancements

### Potential Additions
1. **Offline Mode:** Cache routes and POIs
2. **GPS Check-in:** Automatic check-in when near a location
3. **QR Code Scanning:** Verify visits at attractions
4. **Social Sharing:** Share achievements and routes
5. **Push Notifications:** Seasonal challenges, nearby places
6. **Photo Uploads:** Add photos to visited places
7. **Reviews & Ratings:** User-generated content
8. **Friends System:** Connect with other travelers
9. **Route History:** Save and replay past routes
10. **Multi-language Support:** Add Kazakh language

### Database Integration
Currently using in-memory storage. For production:
- PostgreSQL for POI data and user profiles
- Redis for leaderboard caching
- MongoDB for user-generated content

### Analytics
Track engagement per age group using:
- Firebase Analytics
- Amplitude
- Custom analytics dashboard

## 🐛 Troubleshooting

### Common Issues

**1. Server Connection Error**
- Ensure backend is running on `localhost:3001`
- Update API URLs if deploying to production

**2. Map Not Displaying**
- Check `react-native-maps` configuration
- Verify Google Maps API key (if required)

**3. AsyncStorage Issues**
- Clear app data/cache
- Reinstall the app

## 📝 Code Quality

### Best Practices Followed
- Modular component structure
- Separation of concerns (UI, logic, data)
- Consistent naming conventions
- Comprehensive error handling
- Responsive design patterns
- Accessibility considerations

## 🎓 Developer Notes

### Key Files to Understand
1. **`constants/userSegments.js`** - Core segmentation logic
2. **`server/server.js`** - Backend route building algorithm
3. **`screens/AIRouteBuilderScreen.js`** - Complex form and map integration
4. **`screens/AchievementsScreen.js`** - Progress tracking patterns

### Testing Recommendations
- Test with different age groups
- Verify budget filtering
- Check distance calculations
- Test achievement unlock logic
- Validate leaderboard sorting

---

**Implementation Date:** November 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete & Ready for Testing
