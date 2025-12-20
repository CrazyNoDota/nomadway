# NomadWay Docker Setup Guide

This guide explains how to run the NomadWay backend with Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your actual values, especially:
   - `POSTGRES_PASSWORD` - Secure database password
   - `JWT_SECRET` - Random secret for JWT tokens
   - `JWT_REFRESH_SECRET` - Random secret for refresh tokens
   - `OPENAI_API_KEY` - Your OpenAI API key (for AI features)

2. **Start the services**:
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

4. **Seed the database (optional)**:
   ```bash
   docker-compose exec backend node prisma/seed.js
   ```

5. **Check status**:
   ```bash
   docker-compose ps
   ```

## Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| backend | 3001 | NomadWay API server |
| prisma-studio | 5555 | Database admin UI (optional) |

## Common Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Access database shell
```bash
docker-compose exec postgres psql -U nomadway -d nomadway
```

### Run Prisma migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Open Prisma Studio (database GUI)
```bash
docker-compose --profile tools up prisma-studio -d
```
Then open http://localhost:5555 in your browser.

### Reset database (⚠️ deletes all data)
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend node prisma/seed.js
```

## Development

For local development without Docker:

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Mobile App Development

The mobile app (React Native/Expo) runs separately:

```bash
# From project root
npm install
npm start
```

Configure the API URL in your app to point to the backend:
- Docker: `http://localhost:3001`
- Local development: `http://localhost:3001` or your machine's IP

## Troubleshooting

### Port already in use
```bash
# Find and stop process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps
docker-compose logs postgres
```

### Rebuild images from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```
