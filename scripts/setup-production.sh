#!/bin/bash

# Production Environment Setup Script for AZI Frontend
# This script sets up the environment for production deployment

echo "🚀 Setting up production environment for AZI Frontend..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Please run this script from the azi-frontend directory"
    exit 1
fi

# Set environment to production
echo "📝 Setting environment to production..."

# Create production .env file
cat > .env << EOF
# hosting environment (development/production)
VITE_ENV=production

# Development variables
VITE_DEV_BACKEND_PORT=5000
VITE_DEV_FRONTEND_PORT=3000
VITE_DEV_BACKEND_SERVER=129.151.191.161
VITE_DEV_API_BASE_URL=http://129.151.191.161:5000

# Production variables
VITE_PROD_BACKEND_PORT=7000
VITE_PROD_FRONTEND_PORT=80
VITE_PROD_BACKEND_SERVER=129.151.191.161
VITE_PROD_API_BASE_URL=http://129.151.191.161:7000

# Server-side only (no VITE_ prefix for vite.config.ts)
DEV_BACKEND_PORT=5000
DEV_FRONTEND_PORT=3000
PROD_BACKEND_PORT=7000
PROD_FRONTEND_PORT=80

# Debug settings (disabled for production)
VITE_DEBUG_API=false
EOF

echo "✅ Environment configured for production"

# Build the application
echo "🔨 Building application for production..."
npm run build

if [[ $? -eq 0 ]]; then
    echo "✅ Production build completed successfully!"
    echo ""
    echo "📋 Production Configuration Summary:"
    echo "   - Environment: production"
    echo "   - Backend Server: 129.151.191.161:7000"
    echo "   - Frontend Port: 80"
    echo "   - API Base URL: http://129.151.191.161:7000"
    echo "   - Debug API: disabled"
    echo ""
    echo "🚀 Ready for deployment!"
    echo "   Deploy the 'dist' folder to your production server"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
