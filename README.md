# 🌍 NomadWay

**An AI-powered travel companion app for exploring Kazakhstan** — featuring intelligent route planning, gamification, and personalized travel recommendations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-green.svg)
![Expo](https://img.shields.io/badge/Expo-54.0.22-000020.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Project](#-running-the-project)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🤖 AI-Powered Features
- **AI Chat Guide** — Intelligent travel assistant powered by OpenAI
- **AI Route Builder** — Smart route planning with age segmentation and interest filtering
- **Personalized Recommendations** — Tailored suggestions based on user preferences

### 🎮 Gamification System
- **Achievement System** — 11 achievements across exploration, walking, and cultural categories
- **Leaderboard** — Compete with other travelers (filtered by age group and time periods)
- **Seasonal Challenges** — Special time-limited travel challenges
- **Points & Rewards** — Earn points for check-ins and exploration

### 🗺️ Exploration Tools
- **Interactive Maps** — Explore attractions with React Native Maps
- **Regional Guides** — Comprehensive guides for Kazakhstan regions
- **Smart Cart** — Plan and organize your travel itinerary
- **Community Features** — Share experiences with fellow travelers

### 🌐 Additional Features
- **Bilingual Support** — Russian and English translations
- **Offline Support** — Local data storage with AsyncStorage
- **Camera Integration** — Capture and share travel moments
- **Location Services** — Real-time location tracking

---

## 🛠️ Tech Stack

### Mobile App (Frontend)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo** | 54.0.22 | Development and build toolchain |
| **React Navigation** | 6.x | Navigation and routing |
| **React Native Maps** | 1.20.1 | Map visualization |
| **Expo Location** | 19.0.7 | GPS and location services |
| **Expo Camera** | 16.0.7 | Camera functionality |
| **AsyncStorage** | 2.2.0 | Local data persistence |

### Backend Server
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18.2 | Web framework |
| **OpenAI SDK** | 4.20.1 | AI chat integration |
| **CORS** | 2.8.5 | Cross-origin requests |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) — [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) or **yarn**
- **Expo CLI** — Install globally: `npm install -g expo-cli`
- **Git** — [Download](https://git-scm.com/)
- **OpenAI API Key** — [Get one here](https://platform.openai.com/api-keys)

### For Mobile Development
- **iOS Simulator** (macOS only) — Requires Xcode
- **Android Emulator** — Requires Android Studio
- **Expo Go App** — Available on [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) and [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nomadway
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Configure Environment Variables

#### Frontend Configuration

Create a `.env` file in the project root:

```env
# Replace with your local IP address (for mobile device testing)
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001
```

> **How to find your local IP:**
> - **Windows:** Run `ipconfig` and look for IPv4 Address
> - **macOS/Linux:** Run `ifconfig` or `ip addr`

#### Backend Configuration

Create a `.env` file in the `server` directory:

```env
# Required: Your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize these settings
OPENAI_MODEL=gpt-4o-mini
MAX_TOKENS=512
PORT=3001
```

---

## ▶️ Running the Project

### Quick Start (Development)

You need to run both the **backend server** and the **mobile app** simultaneously.

#### Terminal 1: Start the Backend Server

```bash
cd server
npm run dev
```

The server will start at `http://localhost:3001`

> **Note:** Use `npm start` for production or `npm run dev` for development with auto-reload.

#### Terminal 2: Start the Mobile App

```bash
# In the project root directory
npm start
```

This launches the Expo development server. You'll see a QR code in the terminal.

### Running on Different Platforms

| Platform | Command | Requirements |
|----------|---------|--------------|
| **iOS Simulator** | `npm run ios` | macOS + Xcode |
| **Android Emulator** | `npm run android` | Android Studio |
| **Web Browser** | `npm run web` | None |
| **Physical Device** | Scan QR code with Expo Go | Expo Go app |

### Running on a Physical Device

1. Install **Expo Go** on your mobile device
2. Ensure your phone and computer are on the **same Wi-Fi network**
3. Run `npm start` in the project root
4. Scan the QR code with:
   - **iOS:** Camera app or Expo Go
   - **Android:** Expo Go app

---

## 📁 Project Structure

```
nomadway/
├── 📱 App.js                    # Main app entry & navigation setup
├── 📦 package.json              # Frontend dependencies
├── ⚙️ app.json                  # Expo configuration
├── 🔐 .env                      # Environment variables
│
├── 📂 screens/                  # App screens (22 screens)
│   ├── HomeScreen.js            # Main home screen
│   ├── ExploreScreen.js         # Explore attractions
│   ├── AIGuideScreen.js         # AI chat interface
│   ├── AIRouteBuilderScreen.js  # AI route planning
│   ├── AchievementsScreen.js    # Gamification achievements
│   ├── LeaderboardScreen.js     # User rankings
│   ├── MapScreen.js             # Interactive map
│   ├── CartScreen.js            # Travel cart/planner
│   ├── CommunityScreen.js       # Community features
│   ├── ProfileScreen.js         # User profile
│   └── ...                      # Additional screens
│
├── 📂 components/               # Reusable UI components
├── 📂 contexts/                 # React context providers
├── 📂 constants/                # App constants & configurations
│   ├── userSegments.js          # User segmentation logic
│   └── gamification.js          # Gamification settings
│
├── 📂 data/                     # Static data & JSON files
│   └── attractions.json         # Attractions database
│
├── 📂 utils/                    # Utility functions
│   ├── localization.js          # i18n translations
│   └── routeBuilderUtils.js     # Route calculation helpers
│
├── 📂 assets/                   # Images, fonts, and media
│
└── 📂 server/                   # Backend API server
    ├── server.js                # Express server implementation
    ├── package.json             # Backend dependencies
    └── README.md                # Server documentation
```

---

## 🔌 API Endpoints

The backend provides the following endpoints:

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send messages to AI assistant |
| `GET` | `/health` | Server health check |

### Route Building
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/routes/build` | Generate AI-optimized travel routes |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/gamification/checkin` | Check in at a location |
| `GET` | `/api/gamification/progress/:userId` | Get user progress |
| `GET` | `/api/gamification/leaderboard` | Get leaderboard rankings |
| `PUT` | `/api/gamification/profile/:userId` | Update user profile |

### Example API Call

```bash
# Test the health endpoint
curl http://localhost:3001/health

# Test the chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the best places to visit in Almaty?"}'
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | ✅ | — | Backend API URL |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key for AI features |
| `OPENAI_MODEL` | ❌ | `gpt-4o-mini` | OpenAI model to use |
| `MAX_TOKENS` | ❌ | `512` | Max tokens per AI response |
| `PORT` | ❌ | `3001` | Backend server port |

### App Permissions (Android)

The app requires the following permissions (configured in `app.json`):

- `ACCESS_COARSE_LOCATION` — Approximate location
- `ACCESS_FINE_LOCATION` — Precise GPS location
- `CAMERA` — Photo capture
- `RECORD_AUDIO` — Voice features
- `READ_EXTERNAL_STORAGE` — Access photos
- `WRITE_EXTERNAL_STORAGE` — Save photos

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Network Error" or Can't Connect to Backend

1. Ensure the backend server is running (`npm run dev` in `/server`)
2. Check that your `.env` file has the correct IP address
3. Verify both devices are on the same network
4. Try using `http://10.0.2.2:3001` for Android Emulator

#### ❌ Expo Go Can't Find the Server

1. Make sure you're on the same Wi-Fi network
2. Try running `expo start --tunnel` for a tunneled connection
3. Check firewall settings aren't blocking port 3001 or 8081

#### ❌ OpenAI API Errors

1. Verify your `OPENAI_API_KEY` is valid
2. Check your OpenAI account has credits
3. Review the model name is correct (`gpt-4o-mini`)

#### ❌ Maps Not Loading

1. For production, configure Google Maps API keys in `app.json`
2. Ensure location permissions are granted

### Clearing Cache

```bash
# Clear Expo cache
expo start -c

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System architecture and design
- [`CHECKLIST.md`](./CHECKLIST.md) — Implementation progress checklist
- [`AI_CHAT_SETUP.md`](./AI_CHAT_SETUP.md) — AI chat configuration guide
- [`server/README.md`](./server/README.md) — Backend API documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public distribution.

---

## 👥 Support

For questions or issues, please refer to the troubleshooting section or check the additional documentation files included in the project.

---

**Built with ❤️ for travelers exploring Kazakhstan**
