npmn# Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd nomadway
npm install
```

### 2. Start the Development Server

```bash
npm start
```

This will start the Expo development server and show a QR code.

### 3. Run on Your Device

**Option A: Using Expo Go App**
1. Install "Expo Go" from App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the terminal
3. The app will load on your device

**Option B: Using Emulator/Simulator**
- **iOS**: `npm run ios` (requires Xcode on Mac)
- **Android**: `npm run android` (requires Android Studio)
- **Web**: `npm run web`

## 📱 Testing the App

### Demo Flow:

1. **Splash Screen** - App opens with NomadWay logo and tagline
2. **Explore Tab** - Browse attractions, search, tap to see details
3. **Routes Tab** - View thematic routes, tap to see route details with map
4. **Community Tab** - Read reviews and tips from travelers
5. **Profile Tab** - Save attractions and view saved places

### Key Features to Test:

- ✅ Search attractions in Explore screen
- ✅ View attraction details with map
- ✅ Save/unsave attractions (bookmark icon)
- ✅ View route details with polyline on map
- ✅ Navigate to full map view
- ✅ Read community reviews
- ✅ View saved places in Profile

## 🎨 Customization

### Colors (in `styles` files):
- Primary Green: `#1a4d3a` (steppe)
- Gold Accent: `#d4af37` (cultural gold)
- Blue: `#3498db` (sky)
- Red: `#e74c3c` (important elements)

### Data Files:
- `data/attractions.json` - Add/modify attractions
- `data/routes.json` - Add/modify routes
- `data/community.json` - Add/modify reviews and tips

## ⚠️ Notes

- Images are loaded from Unsplash (requires internet connection)
- Maps require internet for initial load (then cached)
- All data is stored locally (no backend needed)
- Saved places persist using AsyncStorage

## 🐛 Troubleshooting

**Issue: Maps not showing**
- Ensure you have internet connection for initial map load
- On iOS, you may need to configure location permissions in `app.json`

**Issue: Images not loading**
- Check internet connection (images load from Unsplash)
- Images will show placeholder if offline

**Issue: Navigation not working**
- Ensure all dependencies are installed: `npm install`
- Clear cache: `npm start -- --clear`

---

Happy coding! 🎉

