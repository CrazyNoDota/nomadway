# NomadWay VPS Deployment Guide

Complete guide for deploying NomadWay website and backend API to your VPS.

## 🖥️ Server Information

| Property | Value |
|----------|-------|
| **Server IP** | `91.228.154.82` |
| **SSH Command** | `ssh root@91.228.154.82` |
| **Website URL** | `http://91.228.154.82` |
| **API URL** | `http://91.228.154.82/api` |

---

## 📋 Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root SSH access
- At least 1GB RAM, 20GB storage

---

## 🚀 Quick Deployment (Automated)

### Step 1: Connect to VPS

```bash
ssh root@91.228.154.82
# Password: mCslixxxEuxVFiu7
```

### Step 2: Upload Project Files

**Option A: From your local machine (run in PowerShell/Terminal):**

```powershell
# Navigate to your project folder
cd d:\projects\nomadway

# Upload to VPS using SCP
scp -r * root@91.228.154.82:/var/www/nomadway/
```

**Option B: Clone from Git (on VPS):**

```bash
mkdir -p /var/www/nomadway
cd /var/www/nomadway
git clone <your-repository-url> .
```

### Step 3: Run Deployment Script

```bash
cd /var/www/nomadway/deployment
chmod +x vps-deploy.sh
sudo bash vps-deploy.sh
```

The script will automatically:
- ✅ Install Node.js 20, Nginx, PostgreSQL, PM2
- ✅ Create database and user
- ✅ Install dependencies
- ✅ Build the website
- ✅ Run database migrations
- ✅ Configure Nginx
- ✅ Start the backend with PM2
- ✅ Configure firewall

---

## 📝 Manual Deployment (Step-by-Step)

If you prefer manual setup or the automated script fails:

### 1. Update System & Install Dependencies

```bash
apt update && apt upgrade -y
apt install -y curl wget git nginx postgresql postgresql-contrib

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2
```

### 2. Setup PostgreSQL

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER nomadway WITH PASSWORD 'nomadway_secure_password_2024';
CREATE DATABASE nomadway OWNER nomadway;
GRANT ALL PRIVILEGES ON DATABASE nomadway TO nomadway;
EOF
```

### 3. Create Directories

```bash
mkdir -p /var/www/nomadway
mkdir -p /var/www/nomadway/uploads
mkdir -p /var/www/nomadway-files/apk
mkdir -p /var/log/nomadway
```

### 4. Upload Project Files

```bash
# From your local machine:
scp -r d:\projects\nomadway\* root@91.228.154.82:/var/www/nomadway/
```

### 5. Configure Environment

```bash
cd /var/www/nomadway/server

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://nomadway:nomadway_secure_password_2024@localhost:5432/nomadway?schema=public
JWT_SECRET=change-this-to-a-secure-random-string-64-chars
JWT_REFRESH_SECRET=change-this-to-another-secure-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://91.228.154.82
OPENAI_API_KEY=
EOF

# Generate secure JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
# Copy output and update .env file
nano .env
```

### 6. Install Dependencies & Build

```bash
# Install server dependencies
cd /var/www/nomadway/server
npm install --production

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Build website
cd /var/www/nomadway/website
npm install
npm run build
```

### 7. Configure Nginx

```bash
# Copy nginx config
cp /var/www/nomadway/deployment/nginx/nomadway-vps.conf /etc/nginx/sites-available/nomadway

# Add rate limiting to nginx.conf
grep -q "limit_req_zone" /etc/nginx/nginx.conf || \
    sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' /etc/nginx/nginx.conf

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/nomadway /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx
systemctl enable nginx
```

### 8. Start Backend with PM2

```bash
cd /var/www/nomadway/server
pm2 start src/index.js --name nomadway-server
pm2 save
pm2 startup
```

### 9. Set Permissions

```bash
chown -R www-data:www-data /var/www/nomadway/website/dist
chown -R www-data:www-data /var/www/nomadway/uploads
chown -R www-data:www-data /var/www/nomadway-files/apk
chmod 755 /var/www/nomadway/uploads
chmod 755 /var/www/nomadway-files/apk
```

### 10. Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## ✅ Verify Deployment

### Check Website
Open in browser: `http://91.228.154.82`

### Check API Health
```bash
curl http://91.228.154.82/health
# Should return: {"status":"ok"} or similar
```

### Check PM2 Status
```bash
pm2 status
pm2 logs nomadway-server
```

### Check Nginx Status
```bash
systemctl status nginx
tail -f /var/log/nginx/nomadway.error.log
```

---

## 📱 Mobile App Configuration

Update your React Native app to use the VPS backend:

### Update API URL in `utils/communityApi.js` or similar:

```javascript
const API_BASE_URL = 'http://91.228.154.82/api';
```

### Update in `App.js` or config file:

```javascript
const config = {
  apiUrl: 'http://91.228.154.82/api',
  websocketUrl: 'ws://91.228.154.82',
};
```

---

## 📦 APK Deployment

To make your APK available for download:

```bash
# Upload APK to VPS
scp your-app.apk root@91.228.154.82:/var/www/nomadway-files/apk/nomadway-latest.apk

# Set permissions
chown www-data:www-data /var/www/nomadway-files/apk/nomadway-latest.apk
```

Download URL: `http://91.228.154.82/download/nomadway-latest.apk`

---

## 🔄 Update Deployment

To deploy updates:

```bash
# Connect to VPS
ssh root@91.228.154.82

# Navigate to project
cd /var/www/nomadway

# Pull latest changes (if using git)
git pull origin main

# Or upload new files
# scp -r updated-files/* root@91.228.154.82:/var/www/nomadway/

# Rebuild website
cd website
npm install
npm run build

# Update server dependencies if needed
cd ../server
npm install --production
npx prisma migrate deploy

# Restart backend
pm2 restart nomadway-server
```

---

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check backend status |
| `pm2 logs nomadway-server` | View backend logs |
| `pm2 restart nomadway-server` | Restart backend |
| `pm2 stop nomadway-server` | Stop backend |
| `pm2 monit` | Monitor resources |
| `systemctl status nginx` | Check Nginx status |
| `systemctl reload nginx` | Reload Nginx config |
| `tail -f /var/log/nginx/nomadway.error.log` | View Nginx errors |
| `sudo -u postgres psql nomadway` | Connect to database |

---

## 🔒 Security Recommendations

### 1. Change SSH Password
```bash
passwd root
# Enter new secure password
```

### 2. Update JWT Secrets
Edit `/var/www/nomadway/server/.env` and set unique, random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Change Database Password
```bash
sudo -u postgres psql
ALTER USER nomadway WITH PASSWORD 'new-secure-password';
\q

# Update .env file
nano /var/www/nomadway/server/.env
# Update DATABASE_URL with new password

# Restart server
pm2 restart nomadway-server
```

### 4. Setup SSH Keys (Optional but Recommended)
```bash
# On your local machine, generate key if needed:
ssh-keygen -t ed25519

# Copy to server:
ssh-copy-id root@91.228.154.82
```

### 5. Add SSL Certificate (When you have a domain)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🆘 Troubleshooting

### Website not loading
```bash
# Check Nginx
systemctl status nginx
nginx -t
tail -f /var/log/nginx/nomadway.error.log

# Check if dist folder exists
ls -la /var/www/nomadway/website/dist/
```

### API returning 502/503
```bash
# Check if backend is running
pm2 status
pm2 logs nomadway-server

# Check if port 3001 is listening
netstat -tlnp | grep 3001
```

### Database connection error
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test connection
sudo -u postgres psql -c "SELECT 1"

# Check .env DATABASE_URL
cat /var/www/nomadway/server/.env
```

### Permission denied errors
```bash
chown -R www-data:www-data /var/www/nomadway/
chmod -R 755 /var/www/nomadway/
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        91.228.154.82                                │
├─────────────────────────────────────────────────────────────────────┤
│                              NGINX                                   │
│                            (Port 80)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /                → Static Website (/var/www/nomadway/website/dist) │
│  /api/*           → Node.js Backend (localhost:3001)                │
│  /socket.io       → WebSocket (localhost:3001)                      │
│  /download/*      → APK Files (/var/www/nomadway-files/apk/)        │
│  /uploads/*       → User Uploads (/var/www/nomadway/uploads/)       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          PostgreSQL                                  │
│                         (Port 5432)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs nomadway-server`
2. Check Nginx errors: `tail -f /var/log/nginx/nomadway.error.log`
3. Verify all services are running: `pm2 status && systemctl status nginx postgresql`
