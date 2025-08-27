#!/bin/bash

# Setup environment variables for farm-frontend
# This script creates a .env.local file with the necessary configuration

echo "Setting up environment variables for farm-frontend..."

# Create .env.local file
cat > .env.local << EOF
# Farm Photos API Configuration
PHOTOS_API_BASE=https://farm-photos-oeh1q91n4-abdur-rahman-morris-projects.vercel.app

# Development Configuration
NODE_ENV="development"
VERCEL_ENV="development"
EOF

echo "✅ Created .env.local with PHOTOS_API_BASE configuration"
echo "📝 PHOTOS_API_BASE=https://farm-photos-oeh1q91n4-abdur-rahman-morris-projects.vercel.app"
echo ""
echo "🚀 You can now run: npm run dev"
