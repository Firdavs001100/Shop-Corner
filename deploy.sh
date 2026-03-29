#!/bin/bash

# PRODUCTION
echo "🚀 Starting production deployment..."

# Reset & pull latest code
git reset --hard
git checkout main
git pull origin main

docker compose up -d

echo "✅ Production deployment complete!"


