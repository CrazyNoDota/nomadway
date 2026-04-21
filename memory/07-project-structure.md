# 07 — Project Structure

Monorepo with three deployable pieces: the mobile app, the backend API,
and the marketing/admin website.

```
nomadway/
├── App.js                  # Expo/React Native entry point
├── app.json                # Expo config — extra.apiUrl baked into APK
├── eas.json                # EAS build profiles (preview / production)
├── babel.config.js
├── package.json            # Mobile app deps (expo, react-native, ...)
│
├── screens/                # RN screens
├── components/             # RN UI components
├── contexts/               # RN providers — AuthContext.js holds API client
├── utils/                  # RN helpers — communityApi, AnalyticsService, aiGuide
├── constants/              # Theme, colors, strings
├── data/                   # Static datasets
├── assets/                 # Images, fonts, splash/icon
│
├── server/                 # Backend (Node/Express, Prisma, Socket.io)
│   ├── src/index.js        # Entry point (initializes socket.io server)
│   ├── prisma/             # schema.prisma + migrations/
│   ├── public/apk/         # Volume mount target for APKs served via backend (legacy path)
│   ├── package.json
│   └── Dockerfile
│
├── website/                # Landing/admin site (Vite + React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Download-APK button lives here
│   │   │   └── AdminDashboard.jsx
│   │   └── utils/analytics.js
│   ├── public/             # Static assets copied as-is into dist/
│   │   └── nomadway.apk    # Shipped APK, tracked in git
│   ├── nginx.conf          # Production nginx config (inside container)
│   ├── vite.config.js
│   └── Dockerfile
│
├── caddy/
│   └── Caddyfile           # Reverse proxy + TLS config
│
├── docker-compose.yml      # Full production stack
├── memory/                 # This folder — operator notes
└── .gitignore              # *.apk ignored except website/public/nomadway.apk
```

## Container map (at runtime on the server)

| Container | Image | Role |
|---|---|---|
| `nomadway-postgres` | `postgres:16-alpine` | DB |
| `nomadway-backend` | built from `./server` | Express + Prisma + Socket.io on :3001 |
| `nomadway-website` | built from `./website` | nginx serving Vite build |
| `nomadway-caddy` | `caddy:2-alpine` | Reverse proxy + ACME on :80/:443 |
| `nomadway-prisma-studio` | built from `./server`, profile `tools` | Prisma Studio on :5555 (opt-in) |

All are on the `nomadway-network` bridge network.

## Who talks to whom

```
Internet
   │
   ├──► :80/:443  caddy  ┬──► website:80    (any non-API path)
   │                     └──► backend:3001  (/api/*, /socket.io/*, /health)
   │
   └──► :3001            backend  (direct, used by mobile app)

backend ──► postgres:5432 (internal only)
```

## Where each URL a user might care about comes from

- `nomadsway.kz/` → Caddy → website container → `/usr/share/nginx/html/index.html`
- `nomadsway.kz/api/v1/...` → Caddy `@api` matcher → `backend:3001`
- `nomadsway.kz/health` → Caddy → `backend:3001/health`
- `nomadsway.kz/nomadway.apk` → Caddy → website container → static file
- `2.134.15.37:3001/...` → bypasses Caddy, straight to backend
