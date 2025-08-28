#!/bin/bash

# Setup environment variables for farm-frontend
# This script creates a .env.local file with the necessary configuration

echo "Setting up environment variables for farm-frontend..."

# Create .env.local file
cat > .env.local << EOF
# Farm Photos API Configuration

# Development Configuration
NODE_ENV="development"
VERCEL_ENV="development"
EOF

echo ""
echo "🚀 You can now run: npm run dev"
