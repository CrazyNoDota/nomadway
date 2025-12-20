# NomadWay Backend Server v2.0

A production-ready Node.js/Express backend for the NomadWay Kazakhstan travel app, featuring PostgreSQL with Prisma ORM, JWT authentication, real-time WebSocket support, and AI-powered features.

## 🚀 Features

- **PostgreSQL Database** with Prisma ORM for type-safe database access
- **JWT Authentication** with access/refresh token flow and role-based access control
- **Real-time Updates** via Socket.io for community features
- **AI Integration** with OpenAI for smart travel recommendations
- **Cloudinary Integration** for avatar and media uploads
- **Email Notifications** via Nodemailer (Gmail SMTP)
- **Admin Dashboard API** for content moderation
- **Gamification System** with achievements and leaderboards
- **Soft Deletes** for data recovery

## 📁 Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding script
├── src/
│   ├── config/
│   │   ├── index.js       # Server configuration
│   │   └── database.js    # Prisma client
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication
│   │   └── validation.js  # Zod validation schemas
│   ├── routes/
│   │   ├── auth.js        # Authentication endpoints
│   │   ├── cart.js        # Shopping cart
│   │   ├── favorites.js   # Wishlist/favorites
│   │   ├── gamification.js# Achievements & leaderboard
│   │   ├── community.js   # Social features
│   │   ├── attractions.js # POI management
│   │   ├── routes.js      # AI route builder
│   │   ├── admin.js       # Admin dashboard
│   │   └── upload.js      # File uploads
│   ├── services/
│   │   └── emailService.js# Email templates
│   ├── utils/
│   │   └── auth.js        # Password & token utilities
│   └── index.js           # Main entry point
├── server.js              # Legacy server (deprecated)
├── package.json
└── .env.example
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 14+ (or use Docker)
- OpenAI API key
- Cloudinary account (optional, for uploads)
- Gmail account (optional, for emails)

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random 64-character string
- `JWT_REFRESH_SECRET` - Another random 64-character string
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create migration (production)
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Start Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000`.

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/profile` | Update profile |

### Cart (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:itemId` | Update cart item |
| DELETE | `/api/cart/:itemId` | Remove cart item |
| DELETE | `/api/cart` | Clear cart |
| POST | `/api/cart/sync` | Sync local cart after login |

### Favorites (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user's favorites |
| POST | `/api/favorites` | Add to favorites |
| PUT | `/api/favorites/:id` | Update favorite notes |
| DELETE | `/api/favorites/:id` | Remove from favorites |

### Gamification (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gamification/check-in` | Record location check-in |
| GET | `/api/gamification/achievements` | Get user achievements |
| GET | `/api/gamification/leaderboard` | Get points leaderboard |
| GET | `/api/gamification/stats` | Get user statistics |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/community/feed` | Get community posts |
| GET | `/api/community/posts/:id` | Get post details |
| POST | `/api/community/posts` | Create new post (auth) |
| PUT | `/api/community/posts/:id` | Update post (auth) |
| DELETE | `/api/community/posts/:id` | Delete post (auth) |
| POST | `/api/community/posts/:id/like` | Toggle like (auth) |
| POST | `/api/community/posts/:id/bookmark` | Toggle bookmark (auth) |
| POST | `/api/community/posts/:id/comments` | Add comment (auth) |
| POST | `/api/community/posts/:id/report` | Report post (auth) |

### Attractions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attractions` | List attractions |
| GET | `/api/attractions/search` | Search attractions |
| GET | `/api/attractions/:id` | Get attraction details |
| POST | `/api/attractions/:id/review` | Add review (auth) |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/routes/build` | Build AI route (auth) |
| GET | `/api/routes/saved` | Get saved routes (auth) |
| POST | `/api/routes/save` | Save route (auth) |
| DELETE | `/api/routes/:id` | Delete saved route (auth) |
| POST | `/api/routes/:id/email` | Email route summary (auth) |

### Upload (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/avatar` | Upload user avatar |
| POST | `/api/upload/media` | Upload post media |

### Admin (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/:id/role` | Change user role |
| PUT | `/api/admin/users/:id/status` | Activate/deactivate user |
| GET/POST | `/api/admin/attractions` | Manage attractions |
| PUT | `/api/admin/posts/:id/moderate` | Moderate posts |
| GET | `/api/admin/reports` | View content reports |
| GET | `/api/admin/analytics` | User analytics |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI guide |

## 🔐 Authentication Flow

1. User registers or logs in → receives `accessToken` (15min) + `refreshToken` (7 days)
2. Include `Authorization: Bearer <accessToken>` header in protected requests
3. When accessToken expires, call `/api/auth/refresh` with refreshToken
4. On logout, call `/api/auth/logout` to invalidate refreshToken

## 🎮 Gamification System

- **Check-ins**: Users earn points for visiting attractions
- **Achievements**: Auto-awarded based on thresholds (places visited, distance walked, etc.)
- **Leaderboard**: Global ranking by total points

## 🔄 Real-time Features

WebSocket events via Socket.io:
- `new-post`: When a new community post is created
- `post-liked`: When a post receives a like
- `new-comment`: When a comment is added

## 🧪 Development Tools

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (⚠️ deletes all data)
npm run db:reset

# Run legacy server (for comparison)
npm run legacy
```

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for refresh tokens |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `PORT` | ❌ | Server port (default: 3000) |
| `NODE_ENV` | ❌ | Environment (development/production) |
| `FRONTEND_URL` | ❌ | Frontend URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ❌ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ❌ | Cloudinary API secret |
| `SMTP_HOST` | ❌ | SMTP server host |
| `SMTP_USER` | ❌ | SMTP username |
| `SMTP_PASS` | ❌ | SMTP password |

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

### Railway / Render

1. Connect your GitHub repository
2. Set environment variables
3. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Set start command: `npm start`

## 📄 License

ISC
