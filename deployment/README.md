# NomadWay Deployment Guide

This guide covers deploying NomadWay on a single VPS with Nginx.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX                                │
│                    (Port 80/443)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  nomadway.kz/         →  Static files (website/dist)        │
│  nomadway.kz/api/*    →  Node.js backend (localhost:3001)   │
│  nomadway.kz/uploads  →  APK files (/var/www/nomadway/uploads)
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Ubuntu 20.04+ VPS
- Domain pointing to VPS IP (nomadway.kz)
- At least 1GB RAM, 20GB storage

## Quick Deploy

```bash
# Clone your repository
cd /var/www
git clone <your-repo-url> nomadway

# Run deployment script
cd nomadway
sudo chmod +x deployment/deploy.sh
sudo ./deployment/deploy.sh
```

## Manual Deployment Steps

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Setup Project

```bash
# Create project directory
sudo mkdir -p /var/www/nomadway
cd /var/www/nomadway

# Copy your project files (or git clone)
# git clone <your-repo-url> .

# Install server dependencies
cd server
npm install --production

# Install website dependencies and build
cd ../website
npm install
npm run build
```

### 3. Configure Environment

Create `/var/www/nomadway/server/.env`:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/nomadway
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://nomadway.kz
OPENAI_API_KEY=sk-your-openai-key
```

### 4. Setup Database

```bash
cd /var/www/nomadway/server

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 5. Configure Nginx

```bash
# Copy nginx configuration
sudo cp /var/www/nomadway/deployment/nginx/nomadway.conf /etc/nginx/sites-available/nomadway

# Create symlink
sudo ln -s /etc/nginx/sites-available/nomadway /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Add rate limiting to main nginx.conf (inside http block)
sudo nano /etc/nginx/nginx.conf
# Add: limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6. Setup SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d nomadway.kz -d www.nomadway.kz

# Test auto-renewal
sudo certbot renew --dry-run
```

### 7. Start Application

```bash
cd /var/www/nomadway/server

# Start with PM2
pm2 start src/index.js --name nomadway-server

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### 8. Create Uploads Directory

```bash
# Create uploads directory for APK files
sudo mkdir -p /var/www/nomadway/uploads
sudo chown www-data:www-data /var/www/nomadway/uploads

# Copy your APK file
# sudo cp nomadway.apk /var/www/nomadway/uploads/
```

## Useful Commands

```bash
# View server logs
pm2 logs nomadway-server

# Restart server
pm2 restart nomadway-server

# Monitor processes
pm2 monit

# Rebuild website after changes
cd /var/www/nomadway/website && npm run build

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/nomadway.error.log
```

## Updating the Application

```bash
cd /var/www/nomadway

# Pull latest changes
git pull origin main

# Update dependencies
cd server && npm install --production
cd ../website && npm install && npm run build

# Run new migrations
cd ../server
npx prisma migrate deploy

# Restart server
pm2 restart nomadway-server
```

## Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Monitoring

Consider setting up:
- **PM2 Keymetrics** - For Node.js monitoring
- **Fail2ban** - For security
- **Logrotate** - For log management

## Troubleshooting

### 502 Bad Gateway
- Check if Node.js server is running: `pm2 status`
- Check server logs: `pm2 logs nomadway-server`
- Verify port configuration in Nginx and server

### SSL Certificate Issues
- Renew certificate: `sudo certbot renew`
- Check certificate status: `sudo certbot certificates`

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env file
- Test connection: `npx prisma db pull`
