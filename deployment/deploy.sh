#!/bin/bash

# ===========================================
# NomadWay Deployment Script
# ===========================================
# This script deploys the NomadWay application
# including the website, server, and Nginx config
# ===========================================

set -e

echo "🚀 Starting NomadWay Deployment..."

# Configuration
PROJECT_DIR="/var/www/nomadway"
UPLOADS_DIR="/var/www/nomadway/uploads"
NGINX_CONF="/etc/nginx/sites-available/nomadway"
NODE_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo)"
    exit 1
fi

# ===========================================
# Step 1: Create directories
# ===========================================
echo ""
echo "📁 Creating directories..."
mkdir -p $PROJECT_DIR
mkdir -p $UPLOADS_DIR
mkdir -p /var/log/nomadway
print_status "Directories created"

# ===========================================
# Step 2: Install dependencies
# ===========================================
echo ""
echo "📦 Installing Node.js dependencies..."

# Server dependencies
cd $PROJECT_DIR/server
npm install --production
print_status "Server dependencies installed"

# Website dependencies
cd $PROJECT_DIR/website
npm install
print_status "Website dependencies installed"

# ===========================================
# Step 3: Build website
# ===========================================
echo ""
echo "🔨 Building website..."
cd $PROJECT_DIR/website
npm run build
print_status "Website built successfully"

# ===========================================
# Step 4: Database migration
# ===========================================
echo ""
echo "🗃️ Running database migrations..."
cd $PROJECT_DIR/server
npx prisma generate
npx prisma migrate deploy
print_status "Database migrations completed"

# ===========================================
# Step 5: Setup Nginx
# ===========================================
echo ""
echo "🌐 Configuring Nginx..."

# Add rate limiting to nginx.conf if not present
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' /etc/nginx/nginx.conf
    print_status "Rate limiting zone added"
fi

# Copy Nginx configuration
cp $PROJECT_DIR/deployment/nginx/nomadway.conf $NGINX_CONF

# Create symlink if not exists
if [ ! -f /etc/nginx/sites-enabled/nomadway ]; then
    ln -s $NGINX_CONF /etc/nginx/sites-enabled/nomadway
fi

# Test Nginx configuration
nginx -t
print_status "Nginx configuration valid"

# Reload Nginx
systemctl reload nginx
print_status "Nginx reloaded"

# ===========================================
# Step 6: Setup PM2 for Node.js
# ===========================================
echo ""
echo "⚙️ Setting up PM2 process manager..."

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_status "PM2 installed"
fi

# Stop existing process if running
pm2 stop nomadway-server 2>/dev/null || true
pm2 delete nomadway-server 2>/dev/null || true

# Start server with PM2
cd $PROJECT_DIR/server
pm2 start src/index.js --name nomadway-server --env production
pm2 save
print_status "Server started with PM2"

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
print_status "PM2 startup configured"

# ===========================================
# Step 7: Setup SSL (Let's Encrypt)
# ===========================================
echo ""
echo "🔒 SSL Certificate..."

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    print_status "Certbot installed"
fi

# Check if certificate exists
if [ ! -f /etc/letsencrypt/live/nomadway.kz/fullchain.pem ]; then
    print_warning "SSL certificate not found. Run the following command to obtain one:"
    echo "    sudo certbot --nginx -d nomadway.kz -d www.nomadway.kz"
else
    print_status "SSL certificate found"
fi

# ===========================================
# Step 8: Set permissions
# ===========================================
echo ""
echo "🔐 Setting permissions..."
chown -R www-data:www-data $PROJECT_DIR/website/dist
chown -R www-data:www-data $UPLOADS_DIR
chmod 755 $UPLOADS_DIR
print_status "Permissions set"

# ===========================================
# Deployment Complete
# ===========================================
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Status:"
echo "   Website: https://nomadway.kz"
echo "   API: https://nomadway.kz/api"
echo "   Admin: https://nomadway.kz/admin-stats"
echo ""
echo "📋 Commands:"
echo "   View logs: pm2 logs nomadway-server"
echo "   Restart: pm2 restart nomadway-server"
echo "   Monitor: pm2 monit"
echo ""
