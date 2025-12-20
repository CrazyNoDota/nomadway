# NomadWay Deployment Guide

Complete step-by-step guide for running NomadWay locally and deploying to a VPS.

---

## 📁 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                              NGINX                                   │
│                         (Port 80/443)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  nomadway.kz/            → Static Website (website/dist)            │
│  nomadway.kz/api/*       → Node.js Backend (localhost:3000)         │
│  nomadway.kz/download/*  → APK Files (/var/www/nomadway-files/apk/) │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### File Locations

| Environment | APK Location | Served At |
|-------------|-------------|-----------|
| **Localhost** | `server/public/apk/nomadway-latest.apk` | `http://localhost:5173/download/nomadway-latest.apk` |
| **VPS (Production)** | `/var/www/nomadway-files/apk/nomadway-latest.apk` | `https://nomadway.kz/download/nomadway-latest.apk` |

---

## 🖥️ Part 1: Localhost Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Git

### Step 1: Clone and Install Dependencies

```powershell
# Clone the repository
git clone <your-repo-url> nomadway
cd nomadway

# Install server dependencies
cd server
npm install

# Install website dependencies
cd ../website
npm install
```

### Step 2: Configure Environment

Create `server/.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nomadway
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=sk-your-openai-key
```

### Step 3: Setup Database

```powershell
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### Step 4: Place Test APK File

**IMPORTANT:** For the download button to work locally, you need an APK file.

```powershell
# Create the APK folder (if not exists)
mkdir -p server/public/apk

# Option A: Copy your real APK
copy "path\to\your\app.apk" "server\public\apk\nomadway-latest.apk"

# Option B: Create a dummy file for testing
echo "This is a test APK file" > server/public/apk/nomadway-latest.apk
```

**File must be named:** `nomadway-latest.apk`

### Step 5: Start Both Servers

Open **two terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```
Backend runs at: `http://localhost:3000`

**Terminal 2 - Website:**
```powershell
cd website
npm run dev
```
Website runs at: `http://localhost:5173`

### Step 6: Test Everything

1. Open `http://localhost:5173` in your browser
2. Scroll down to see "Live Stats" section with charts
3. Click "Download APK" button
4. Verify the file downloads
5. Refresh page - download count should increase

---

## 🚀 Part 2: VPS Deployment (From Scratch)

### Prerequisites

- Ubuntu 20.04+ VPS with SSH access
- Domain pointing to VPS IP (e.g., nomadway.kz)
- At least 1GB RAM, 20GB storage

### Step 1: Initial Server Setup

SSH into your server:

```bash
ssh root@your-server-ip
```

Update system and install essentials:

```bash
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx
```

### Step 2: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Step 3: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Step 4: Setup PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE USER nomadway WITH PASSWORD 'your_secure_password';
CREATE DATABASE nomadway OWNER nomadway;
GRANT ALL PRIVILEGES ON DATABASE nomadway TO nomadway;
\q
```

### Step 5: Create Project Directories

```bash
# Main project directory
mkdir -p /var/www/nomadway

# APK files directory (OUTSIDE project folder - won't be overwritten on deploy)
mkdir -p /var/www/nomadway-files/apk

# Set permissions
chown -R www-data:www-data /var/www/nomadway-files
chmod -R 755 /var/www/nomadway-files
```

### Step 6: Clone and Setup Project

```bash
cd /var/www/nomadway
git clone <your-repo-url> .

# Install server dependencies
cd server
npm install --production

# Install website dependencies and build
cd ../website
npm install
npm run build
```

### Step 7: Configure Server Environment

Create `/var/www/nomadway/server/.env`:

```bash
nano /var/www/nomadway/server/.env
```

Add:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://nomadway:your_secure_password@localhost:5432/nomadway
JWT_SECRET=generate-a-very-long-random-string-here
JWT_REFRESH_SECRET=another-very-long-random-string
FRONTEND_URL=https://nomadway.kz
OPENAI_API_KEY=sk-your-openai-key
```

### Step 8: Run Database Migrations

```bash
cd /var/www/nomadway/server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed
npx prisma db seed
```

### Step 9: Upload APK File

**Option A: Using SCP (from your local machine)**

```powershell
# From your local Windows machine
scp "C:\path\to\nomadway.apk" root@your-server-ip:/var/www/nomadway-files/apk/nomadway-latest.apk
```

**Option B: Using FileZilla**

1. Connect to your server via SFTP
2. Navigate to `/var/www/nomadway-files/apk/`
3. Upload your APK file
4. Rename it to `nomadway-latest.apk`

**Option C: Download from another source**

```bash
cd /var/www/nomadway-files/apk
wget -O nomadway-latest.apk "https://your-build-server.com/nomadway.apk"
```

### Step 10: Configure Nginx

```bash
# Copy the nginx config
cp /var/www/nomadway/deployment/nginx/nomadway.conf /etc/nginx/sites-available/nomadway

# Create symlink
ln -s /etc/nginx/sites-available/nomadway /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Add rate limiting zone (edit main nginx.conf)
nano /etc/nginx/nginx.conf
```

Add inside the `http { }` block:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

**Update the port in Nginx config** (if your server runs on port 3000):

```bash
nano /etc/nginx/sites-available/nomadway
```

Change all instances of `proxy_pass http://127.0.0.1:3001` to `proxy_pass http://127.0.0.1:3000`

Test and reload:
```bash
nginx -t
systemctl reload nginx
```

### Step 11: Setup SSL Certificate

```bash
certbot --nginx -d nomadway.kz -d www.nomadway.kz

# Test auto-renewal
certbot renew --dry-run
```

### Step 12: Start the Application

```bash
cd /var/www/nomadway/server

# Start with PM2
pm2 start src/index.js --name nomadway-server

# Save PM2 configuration
pm2 save

# Setup startup script (runs on boot)
pm2 startup
```

### Step 13: Configure Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
ufw status
```

### Step 14: Verify Deployment

1. Visit `https://nomadway.kz` - should see the landing page
2. Check the "Live Stats" section - should show real data
3. Click "Download APK" - should download the file
4. Check API: `https://nomadway.kz/api/analytics/stats/public`

---

## 🔄 Updating the Application

When you push new code:

```bash
cd /var/www/nomadway

# Pull latest changes
git pull origin main

# Update server dependencies (if changed)
cd server
npm install --production

# Run new migrations (if any)
npx prisma migrate deploy

# Rebuild website
cd ../website
npm install
npm run build

# Restart server
pm2 restart nomadway-server
```

**Note:** The APK file in `/var/www/nomadway-files/apk/` will NOT be affected by `git pull`.

---

## 📊 Updating the APK File

When you have a new app version:

```bash
# Upload new APK (from local machine)
scp "C:\path\to\new-nomadway.apk" root@your-server-ip:/var/www/nomadway-files/apk/nomadway-latest.apk

# Or on the server, download it
cd /var/www/nomadway-files/apk
wget -O nomadway-latest.apk "https://your-build-server.com/nomadway-v2.0.0.apk"
```

No need to restart anything - Nginx serves the file directly.

---

## 🔧 Useful Commands

### View Logs

```bash
# Server logs
pm2 logs nomadway-server

# Nginx access logs
tail -f /var/log/nginx/nomadway.access.log

# Nginx error logs
tail -f /var/log/nginx/nomadway.error.log
```

### Restart Services

```bash
# Restart Node.js server
pm2 restart nomadway-server

# Restart Nginx
systemctl restart nginx

# Restart PostgreSQL
systemctl restart postgresql
```

### Monitor

```bash
# Process monitor
pm2 monit

# Server status
pm2 status
```

---

## 🐛 Troubleshooting

### 502 Bad Gateway

1. Check if Node.js is running: `pm2 status`
2. Check server logs: `pm2 logs nomadway-server`
3. Verify port in Nginx config matches your server

### APK Not Downloading

1. Check file exists: `ls -la /var/www/nomadway-files/apk/`
2. Check permissions: `chmod 644 /var/www/nomadway-files/apk/nomadway-latest.apk`
3. Check Nginx config: `nginx -t`

### Analytics Not Working

1. Check database connection: `pm2 logs nomadway-server | grep prisma`
2. Run migrations: `cd /var/www/nomadway/server && npx prisma migrate deploy`

### SSL Certificate Issues

```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

---

## 📋 Checklist

### Local Development
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] `server/.env` configured
- [ ] Database migrated
- [ ] APK file placed in `server/public/apk/nomadway-latest.apk`
- [ ] Both servers started

### Production Deployment
- [ ] VPS accessible via SSH
- [ ] Node.js 18+ installed
- [ ] PostgreSQL configured
- [ ] PM2 installed
- [ ] Project cloned to `/var/www/nomadway`
- [ ] APK folder created: `/var/www/nomadway-files/apk/`
- [ ] APK file uploaded: `nomadway-latest.apk`
- [ ] `.env` configured for production
- [ ] Database migrated
- [ ] Nginx configured and running
- [ ] SSL certificate installed
- [ ] PM2 running and saved
- [ ] Firewall configured
