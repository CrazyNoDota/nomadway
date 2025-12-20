#!/bin/bash

# ===========================================
# NomadWay VPS Deployment Script
# Server: 91.228.154.82
# ===========================================
# This script sets up and deploys the NomadWay application
# Run as root: sudo bash vps-deploy.sh
# ===========================================

set -e

echo "🚀 Starting NomadWay VPS Deployment..."
echo "   Server: 91.228.154.82"
echo ""

# Configuration
PROJECT_DIR="/var/www/nomadway"
UPLOADS_DIR="/var/www/nomadway/uploads"
APK_DIR="/var/www/nomadway-files/apk"
NGINX_CONF="/etc/nginx/sites-available/nomadway"
NODE_PORT=3001
SERVER_IP="91.228.154.82"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo bash vps-deploy.sh)"
    exit 1
fi

# ===========================================
# Step 1: Update system and install dependencies
# ===========================================
echo ""
echo "📦 Step 1: Installing system dependencies..."

apt-get update
apt-get upgrade -y
apt-get install -y curl wget git nginx postgresql postgresql-contrib

# Install Node.js 20.x
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    print_status "Node.js installed: $(node -v)"
else
    print_status "Node.js already installed: $(node -v)"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

print_status "System dependencies installed"

# ===========================================
# Step 2: Setup PostgreSQL
# ===========================================
echo ""
echo "🗃️ Step 2: Setting up PostgreSQL..."

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user (if not exists)
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'nomadway'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER nomadway WITH PASSWORD 'nomadway_secure_password_2024';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'nomadway'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE nomadway OWNER nomadway;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nomadway TO nomadway;"

print_status "PostgreSQL configured"

# ===========================================
# Step 3: Create directories
# ===========================================
echo ""
echo "📁 Step 3: Creating directories..."

mkdir -p $PROJECT_DIR
mkdir -p $UPLOADS_DIR
mkdir -p $APK_DIR
mkdir -p /var/log/nomadway
mkdir -p /var/www/certbot

print_status "Directories created"

# ===========================================
# Step 4: Clone or update repository
# ===========================================
echo ""
echo "📥 Step 4: Checking project files..."

if [ -d "$PROJECT_DIR/.git" ]; then
    print_info "Project exists, pulling latest changes..."
    cd $PROJECT_DIR
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || print_warning "Git pull skipped"
else
    print_warning "No git repository found."
    print_info "Please upload your project files to $PROJECT_DIR"
    print_info "You can use: scp -r /path/to/nomadway/* root@${SERVER_IP}:${PROJECT_DIR}/"
fi

# ===========================================
# Step 5: Create environment file
# ===========================================
echo ""
echo "⚙️ Step 5: Creating environment configuration..."

if [ ! -f "$PROJECT_DIR/server/.env" ]; then
    cat > $PROJECT_DIR/server/.env << 'ENVFILE'
# NomadWay Backend Configuration
# Generated for VPS: 91.228.154.82

NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://nomadway:nomadway_secure_password_2024@localhost:5432/nomadway?schema=public

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URLs
FRONTEND_URL=http://91.228.154.82

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ENVFILE

    print_status "Environment file created at $PROJECT_DIR/server/.env"
    print_warning "⚠️  IMPORTANT: Edit $PROJECT_DIR/server/.env and update the secrets!"
else
    print_status "Environment file already exists"
fi

# ===========================================
# Step 6: Install dependencies and build
# ===========================================
echo ""
echo "📦 Step 6: Installing Node.js dependencies..."

# Server dependencies
if [ -d "$PROJECT_DIR/server" ]; then
    cd $PROJECT_DIR/server
    npm install --production
    print_status "Server dependencies installed"
else
    print_error "Server directory not found at $PROJECT_DIR/server"
    exit 1
fi

# Website dependencies and build
if [ -d "$PROJECT_DIR/website" ]; then
    cd $PROJECT_DIR/website
    npm install
    npm run build
    print_status "Website built successfully"
else
    print_error "Website directory not found at $PROJECT_DIR/website"
    exit 1
fi

# ===========================================
# Step 7: Database migration
# ===========================================
echo ""
echo "🗃️ Step 7: Running database migrations..."

cd $PROJECT_DIR/server
npx prisma generate
npx prisma migrate deploy

print_status "Database migrations completed"

# ===========================================
# Step 8: Setup Nginx
# ===========================================
echo ""
echo "🌐 Step 8: Configuring Nginx..."

# Add rate limiting to nginx.conf if not present
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;' /etc/nginx/nginx.conf
    print_status "Rate limiting zone added to nginx.conf"
fi

# Copy Nginx configuration
if [ -f "$PROJECT_DIR/deployment/nginx/nomadway-vps.conf" ]; then
    cp $PROJECT_DIR/deployment/nginx/nomadway-vps.conf $NGINX_CONF
else
    # Create inline if file not found
    cat > $NGINX_CONF << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name 91.228.154.82;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    root /var/www/nomadway/website/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        limit_req zone=api_limit burst=20 nodelay;
    }

    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location /download {
        alias /var/www/nomadway-files/apk;
        sendfile on;
        location ~* \.apk$ {
            add_header Content-Type "application/vnd.android.package-archive";
            add_header Content-Disposition 'attachment; filename="NomadWay.apk"';
        }
    }

    location /uploads {
        alias /var/www/nomadway/uploads;
        client_max_body_size 100M;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }

    error_page 404 /index.html;
    access_log /var/log/nginx/nomadway.access.log;
    error_log /var/log/nginx/nomadway.error.log;
}
NGINXCONF
fi

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Create symlink if not exists
if [ ! -f /etc/nginx/sites-enabled/nomadway ]; then
    ln -s $NGINX_CONF /etc/nginx/sites-enabled/nomadway
fi

# Test and reload Nginx
nginx -t
systemctl reload nginx
systemctl enable nginx

print_status "Nginx configured and running"

# ===========================================
# Step 9: Setup PM2 for Node.js
# ===========================================
echo ""
echo "⚙️ Step 9: Setting up PM2 process manager..."

# Stop existing process if running
pm2 stop nomadway-server 2>/dev/null || true
pm2 delete nomadway-server 2>/dev/null || true

# Start server with PM2
cd $PROJECT_DIR/server
pm2 start src/index.js --name nomadway-server --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

print_status "Server started with PM2"

# ===========================================
# Step 10: Set permissions
# ===========================================
echo ""
echo "🔐 Step 10: Setting permissions..."

chown -R www-data:www-data $PROJECT_DIR/website/dist
chown -R www-data:www-data $UPLOADS_DIR
chown -R www-data:www-data $APK_DIR
chmod 755 $UPLOADS_DIR
chmod 755 $APK_DIR

print_status "Permissions set"

# ===========================================
# Step 11: Configure Firewall
# ===========================================
echo ""
echo "🔥 Step 11: Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw --force enable
    print_status "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall configuration"
fi

# ===========================================
# Deployment Complete
# ===========================================
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Your NomadWay application is now running!"
echo ""
echo "🌐 Access URLs:"
echo "   Website:  http://${SERVER_IP}"
echo "   API:      http://${SERVER_IP}/api"
echo "   Health:   http://${SERVER_IP}/health"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:     pm2 logs nomadway-server"
echo "   Restart:       pm2 restart nomadway-server"
echo "   Stop:          pm2 stop nomadway-server"
echo "   Monitor:       pm2 monit"
echo "   Nginx logs:    tail -f /var/log/nginx/nomadway.error.log"
echo ""
echo "⚠️  Important Next Steps:"
echo "   1. Edit /var/www/nomadway/server/.env and update secrets"
echo "   2. Upload your APK to: $APK_DIR/nomadway-latest.apk"
echo "   3. (Optional) Setup SSL with a domain name"
echo ""
echo "🔒 To add SSL later (requires domain name):"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d yourdomain.com"
echo ""
