# Production Environment Setup Script for AZI Frontend (PowerShell)
# This script sets up the environment for production deployment

Write-Host "🚀 Setting up production environment for AZI Frontend..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the azi-frontend directory" -ForegroundColor Red
    exit 1
}

# Set environment to production
Write-Host "📝 Setting environment to production..." -ForegroundColor Yellow

# Create production .env file
@"
# hosting environment (development/production)
VITE_ENV=production

# Development variables
VITE_DEV_BACKEND_PORT=7000
VITE_DEV_FRONTEND_PORT=3000
VITE_DEV_BACKEND_SERVER=129.151.191.161
VITE_DEV_API_BASE_URL=http://129.151.191.161:7000

# Production variables
VITE_PROD_BACKEND_PORT=7000
VITE_PROD_FRONTEND_PORT=80
VITE_PROD_BACKEND_SERVER=129.151.191.161
VITE_PROD_API_BASE_URL=http://129.151.191.161:7000

# Server-side only (no VITE_ prefix for vite.config.ts)
DEV_BACKEND_PORT=7000
DEV_FRONTEND_PORT=3000
PROD_BACKEND_PORT=7000
PROD_FRONTEND_PORT=80

# Debug settings (disabled for production)
VITE_DEBUG_API=false
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Environment configured for production" -ForegroundColor Green

# Build the application
Write-Host "🔨 Building application for production..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Production build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Production Configuration Summary:" -ForegroundColor Cyan
    Write-Host "   - Environment: production" -ForegroundColor White
    Write-Host "   - Backend Server: 129.151.191.161:7000" -ForegroundColor White
    Write-Host "   - Frontend Port: 80" -ForegroundColor White
    Write-Host "   - API Base URL: http://129.151.191.161:7000" -ForegroundColor White
    Write-Host "   - Debug API: disabled" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
    Write-Host "   Deploy the 'dist' folder to your production server" -ForegroundColor White
} else {
    Write-Host "❌ Build failed! Please check the errors above." -ForegroundColor Red
    exit 1
}
