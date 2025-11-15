# 🚀 Quick Start Guide - New Features

## Overview
This guide will help you test the new AI Route Builder and Gamification features in the NomadWay app.

## 🏁 Setup Instructions

### 1. Start the Backend Server

Open a terminal and run:
```powershell
cd server
npm start
```

You should see:
```
🚀 NomadWay AI Chat API server running on port 3001
📍 Health check: http://localhost:3001/health
```

### 2. Start the React Native App

Open another terminal and run:
```powershell
npm start
```

Then press:
- **`a`** for Android emulator
- **`i`** for iOS simulator

## 🧪 Testing the Features

### AI Route Builder

1. **Navigate to Profile Screen** (bottom tab)
2. **Tap on "AI Конструктор"** card (green card on the left)
3. **Fill in the parameters:**
   - Select age group: Family
   - Select duration: 1 day
   - Enter budget: Min 5000, Max 15000
   - Select activity level: Moderate
   - Select interests: Nature, Adventure, Food

4. **Tap "Построить маршрут"** (Build Route button)

5. **View the results:**
   - Summary card shows total time, cost, and stops
   - Map displays route with numbered markers
   - Timeline shows detailed itinerary
   - Each stop shows alternatives

### Testing Different Audience Modes

**Family Route:**
- Age Group: Семейный отдых (Family)
- Duration: 3 часа
- Activity Level: Лёгко (Easy)
- Interests: Образование, Природа
- Expected: Shorter distances, frequent rest, educational POIs

**Adults Route:**
- Age Group: Взрослые путешественники (Adults)
- Duration: 3 дня
- Activity Level: Средне/Интенсивно (Moderate/Intense)
- Interests: Культура, Музеи, Приключения
- Expected: Cultural depth with optional adventure add-ons

### Gamification Features

#### Achievements Screen

1. Navigate to **Profile Screen**
2. Tap on **"Достижения"** card (gold card on the right)
3. View:
   - Header stats (points, achievements, places)
   - All achievements with progress bars
   - Locked vs unlocked achievements

#### Simulating Progress

To test achievements, you can manually trigger check-ins via the backend:

```powershell
# Using PowerShell
$body = @{
    userId = "test_user_1"
    placeId = 1
    placeName = "Чарынский каньон"
    city = "Almaty"
   ageGroup = "family"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/gamification/checkin" -Method Post -Body $body -ContentType "application/json"
```

This will:
- Add 20 points
- Record the visit
- Check for achievement unlocks

Repeat with different placeIds (1-8) to unlock achievements.

#### Leaderboard Screen

1. Navigate to **Profile Screen**
2. Tap on the **🏆 trophy** in the stats row
3. View:
   - Filter by age group (All, Family, Adults)
   - Filter by period (All Time, Monthly, Weekly)
   - Top users with medals (🥇🥈🥉)
   - Your position highlighted

#### Creating Test Users

Add multiple users to the leaderboard:

```powershell
# User 1 (Family)
$body1 = @{
   userId = "user_family_1"
   username = "Explorer_1"
   ageGroup = "family"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/gamification/profile/user_family_1" -Method Put -Body $body1 -ContentType "application/json"

# User 2 (Adults)
$body2 = @{
   userId = "user_adult_1"
   username = "Traveler_2"
   ageGroup = "adults"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/gamification/profile/user_adult_1" -Method Put -Body $body2 -ContentType "application/json"
```

Then add check-ins for each user to populate the leaderboard.

## 🧩 Feature Integration Points

### From Home Screen
- Users can navigate to **AI Route Builder** via Profile → AI Конструктор

### From Profile Screen
- **Stats Row**: Tap trophy emoji → Leaderboard
- **Stats Row**: Tap "AI" → Route Builder
- **Gamification Cards**: 
  - Green card → Route Builder
  - Gold card → Achievements

### Navigation Flow
```
Profile Screen
├── AI Конструктор → AIRouteBuilderScreen
├── Достижения → AchievementsScreen
└── 🏆 (stats) → LeaderboardScreen
```

## 🎯 Testing Checklist

### Route Builder
- [ ] Age group selection works
- [ ] Duration selection works
- [ ] Budget input accepts numbers
- [ ] Activity level selection works
- [ ] Multiple interests can be selected
- [ ] Route builds successfully
- [ ] Map displays correctly
- [ ] Timeline shows all stops
- [ ] Alternatives are shown
- [ ] Summary card is accurate

### Achievements
- [ ] Stats display correctly
- [ ] Achievement cards show progress
- [ ] Progress bars update
- [ ] Locked achievements are grayed out
- [ ] Unlocked achievements are highlighted
- [ ] Points are calculated correctly

### Leaderboard
- [ ] Age group filter works
- [ ] Period filter works
- [ ] Users are sorted by points
- [ ] Top 3 show medals
- [ ] Current user is highlighted
- [ ] Pull to refresh works

## 🐛 Known Limitations

1. **In-Memory Storage**: Data resets when server restarts
   - Solution: Use persistent database for production

2. **Mock User IDs**: Currently using auto-generated IDs
   - Solution: Integrate with authentication system

3. **Limited Attractions**: Only 8 sample attractions
   - Solution: Add more POIs to `data/attractions.json`

4. **No GPS Verification**: Check-ins are manual
   - Solution: Add location verification in production

5. **Single Language UI**: Some hardcoded Russian text
   - Solution: Complete localization implementation

## 📊 Expected Results

### Route Builder Output Example
```json
{
  "route": [
    {
      "attraction": { ... },
      "visitDuration": 180,
      "travelTime": 45,
      "estimatedCost": 3500,
      "alternatives": [...]
    }
  ],
  "summary": {
    "totalDuration": 345,
    "totalCost": 8500,
    "numberOfStops": 3,
   "ageGroup": "family",
    "activityLevel": "moderate"
  }
}
```

### User Progress Example
```json
{
  "userId": "test_user_1",
  "points": 120,
  "achievements": ["explorer_beginner"],
  "placesVisited": [
    { "id": 1, "name": "Чарынский каньон" },
    { "id": 5, "name": "Алматы - Южная столица" }
  ],
  "citiesVisited": ["Almaty"],
  "distanceWalked": 0,
  "routesCompleted": 0
}
```

## 🎉 Success Indicators

✅ Route Builder generates routes based on filters  
✅ Different age groups get different route recommendations  
✅ Achievements unlock when thresholds are met  
✅ Leaderboard updates in real-time  
✅ UI is responsive and user-friendly  
✅ Navigation flows smoothly between screens  

## 📞 Support

If you encounter issues:
1. Check that the backend server is running
2. Verify console logs for errors
3. Restart the app and server
4. Review the implementation guide: `GAMIFICATION_IMPLEMENTATION.md`

---

**Happy Testing! 🚀**
