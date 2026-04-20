#!/bin/bash

# NomadWay Docker Setup Script
# This script helps initialize the environment for Docker deployment

set -e

echo "🏔️  Initializing NomadWay Docker Environment..."

# Check for .env file
if [ ! -f .env ]; then
    echo "📄 .env file not found. Creating from .env.docker.example..."
    cp .env.docker.example .env
    echo "⚠️  Action Required: Edit the .env file and add your OpenAI API key and other secrets."
else
    echo "✅ .env file already exists."
fi

# Ensure APK directory exists in the volume (or create it locally if needed)
mkdir -p server/public/apk
touch server/public/apk/.gitkeep

echo ""
echo "🚀 Environment ready!"
echo "To start the application, run:"
echo "   docker-compose up -d --build"
echo ""
echo "To view logs:"
echo "   docker-compose logs -f"
echo ""
