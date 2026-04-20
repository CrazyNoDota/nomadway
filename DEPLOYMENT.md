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

---

## 🌐 Plesk Docker Deployment

If you are deploying to a server with **Plesk** (like `plesk.conco.kz`):

1. **Enable Docker Extension**: Ensure the Docker extension is installed in your Plesk panel.
2. **Git Pull**: Use the Plesk Git extension to pull the code to your server.
3. **Setup Environment**:
   - Create a `.env` file in the root directory based on `.env.docker.example`.
   - Update `FRONTEND_URL` to your actual domain (e.g., `https://nomadway.kz`).
4. **Deploy**:
   - Open a terminal in Plesk or via SSH.
   - Run `docker-compose up -d --build`.
5. **APK Downloads**:
   - The system uses a Docker volume named `nomadway_apks`.
   - To make your mobile app downloadable, copy your built APK to the volume's location on the host or use `docker cp nomadway-latest.apk nomadway-backend:/app/public/apk/`.

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
