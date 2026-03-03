#!/bin/bash

# Docker Run Script - Build and run locally

set -e

echo "🐳 Starting x402 Everything with Docker..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found!"
    echo "Please copy .env.production.example and fill in your values"
    exit 1
fi

# Check if MongoDB is running (for local dev)
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB not running on localhost:27017"
    echo "Starting MongoDB with Docker..."
    docker run -d --name x402-mongo -p 27017:27017 mongo:8.0
    sleep 3
fi

echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "✅ Services started!"
echo ""
echo "📍 Access points:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost/api"
echo "   AgentCard: http://localhost/.well-known/agent.json"
echo ""
echo "📊 Check status:"
echo "   docker-compose ps"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
