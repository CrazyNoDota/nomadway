#!/bin/bash

# ===========================================
# NomadWay Quick Server Update Script
# Run this after making code changes
# ===========================================

set -e

echo "🔄 Updating NomadWay Server..."

PROJECT_DIR="/var/www/nomadway"

# Pull latest changes (if using git)
if [ -d "$PROJECT_DIR/.git" ]; then
    cd $PROJECT_DIR
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "Git pull skipped"
fi

# Rebuild website
echo "🔨 Rebuilding website..."
cd $PROJECT_DIR/website
npm install
npm run build

# Update server dependencies
echo "📦 Updating server dependencies..."
cd $PROJECT_DIR/server
npm install --production
npx prisma generate
npx prisma migrate deploy 2>/dev/null || echo "No migrations to run"

# Restart PM2
echo "🔄 Restarting server..."
pm2 restart nomadway-server

echo ""
echo "✅ Update complete!"
echo "   Website: http://91.228.154.82"
echo "   API:     http://91.228.154.82/api"
echo ""
