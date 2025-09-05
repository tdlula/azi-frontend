# Development Environment Setup Script for AZI Frontend (PowerShell)
# This script sets up the environment for local development

Write-Host "🛠️ Setting up development environment for AZI Frontend..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the azi-frontend directory" -ForegroundColor Red
    exit 1
}

# Set environment to development
Write-Host "📝 Setting environment to development..." -ForegroundColor Yellow

# Create development .env file
@"
# hosting environment (development/production)
VITE_ENV=development

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

# Debug settings (enabled for development)
VITE_DEBUG_API=true
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Environment configured for development" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Development Configuration Summary:" -ForegroundColor Cyan
Write-Host "   - Environment: development" -ForegroundColor White
Write-Host "   - Backend Server: 129.151.191.161:7000" -ForegroundColor White
Write-Host "   - Frontend Port: 3000" -ForegroundColor White
Write-Host "   - API Base URL: http://129.151.191.161:7000" -ForegroundColor White
Write-Host "   - Debug API: enabled" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready for development!" -ForegroundColor Green
Write-Host "   Run 'npm run dev' to start the development server" -ForegroundColor White
