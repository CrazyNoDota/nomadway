# 🚀 NomadWay Deployment Guide

This project is optimized for a **Docker-first** deployment strategy. This ensures consistency across development, staging, and production environments.

---

## 🛠️ Prerequisites

- **Docker** & **Docker Compose** installed on your server.
- A **PostgreSQL** database (automatically handled by Docker Compose).
- (Optional) An **OpenAI API Key** for AI-powered travel features.

---

## 📦 Quick Start (Docker Compose)

The easiest way to deploy the entire stack (Database, Backend, and Website) is using Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nomadway
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.docker.example .env
   ```
   Edit `.env` and update the following:
   - `JWT_SECRET`: A long random string.
   - `POSTGRES_PASSWORD`: A secure password for your database.
   - `OPENAI_API_KEY`: Your OpenAI key (if using AI features).

3. **Launch the application:**
   ```bash
   docker-compose up -d --build
   ```

The system will automatically:
- Spin up a **PostgreSQL 16** database.
- Run **Prisma migrations** to set up the database schema.
- Build and start the **Node.js API Server**.
- Build and serve the **Vite + React Website** via Nginx.

---

## 🌐 Access Points

- **Website Frontend:** `http://your-server-ip` (Port 80)
- **Backend API:** `http://your-server-ip:3001`
- **API Health Check:** `http://your-server-ip:3001/health`

---

## 🗃️ Database Management

### Prisma Studio
To manage your data visually (view users, posts, etc.):
```bash
docker-compose run --rm -p 5555:5555 prisma-studio
```
Then visit `http://your-server-ip:5555`.

### Manual Migrations
If you make changes to `server/prisma/schema.prisma`:
```bash
docker-compose exec backend npx prisma migrate dev
```

---

## 🛠️ Troubleshooting & Logs

**View all logs:**
```bash
docker-compose logs -f
```

**View backend specific logs:**
```bash
docker-compose logs -f backend
```

**Restart services:**
```bash
docker-compose restart
```

---

## 🔒 Production Hardening (Next Steps)

1. **SSL/HTTPS:** It is highly recommended to use a reverse proxy like **Nginx Proxy Manager** or **Traefik** in front of this setup to handle SSL certificates via Let's Encrypt.
2. **Backups:** Ensure the `postgres_data` volume is backed up regularly.
3. **Firewall:** Only ports `80` (HTTP) and `443` (HTTPS) should be exposed to the public. Port `3001` and `5432` should ideally be restricted.
