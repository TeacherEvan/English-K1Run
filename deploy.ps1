# Kindergarten Race Game - PowerShell Deployment Script
# This script automates the deployment process on Windows

param(
    [Parameter(Position = 0)]
    [ValidateSet("", "dev", "stop", "logs", "build-only", "help")]
    [string]$Command = ""
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green" 
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $SuccessColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $WarningColor
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $ErrorColor
}

function Test-Docker {
    Write-Status "Checking Docker installation..."
    try {
        $null = docker --version
        Write-Success "Docker is installed"
        return $true
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        return $false
    }
}

function Test-DockerCompose {
    Write-Status "Checking Docker Compose installation..."
    try {
        $null = docker-compose --version
        Write-Success "Docker Compose is installed"
        return $true
    }
    catch {
        Write-Error "Docker Compose is not installed or not in PATH"
        return $false
    }
}

function Build-Application {
    Write-Status "Building React application..."
    try {
        npm run build
        Write-Success "Application built successfully"
        return $true
    }
    catch {
        Write-Error "Failed to build application: $($_.Exception.Message)"
        return $false
    }
}

function Build-DockerImage {
    Write-Status "Building Docker image..."
    try {
        docker build -t kindergarten-race-game .
        Write-Success "Docker image built successfully"
        return $true
    }
    catch {
        Write-Error "Failed to build Docker image: $($_.Exception.Message)"
        return $false
    }
}

function Deploy-Application {
    Write-Status "Deploying with Docker Compose..."
    try {
        docker-compose up -d kindergarten-race
        Write-Success "Application deployed successfully"
        return $true
    }
    catch {
        Write-Error "Failed to deploy application: $($_.Exception.Message)"
        return $false
    }
}

function Test-ApplicationHealth {
    Write-Status "Checking application health..."
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Application is running and healthy"
        }
        else {
            Write-Warning "Application responded with status code: $($response.StatusCode)"
        }
    }
    catch {
        Write-Warning "Application may not be ready yet. Please check manually at http://localhost:3000"
    }
}

function Deploy-Production {
    Write-Host ""
    Write-Host "🎮 Kindergarten Race Game - Deployment Script" -ForegroundColor Magenta
    Write-Host "==============================================" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Status "Starting deployment process..."
    
    # Pre-deployment checks
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-DockerCompose)) { exit 1 }
    
    # Build and deploy
    if (-not (Build-Application)) { exit 1 }
    if (-not (Build-DockerImage)) { exit 1 }
    if (-not (Deploy-Application)) { exit 1 }
    
    Test-ApplicationHealth
    
    Write-Host ""
    Write-Success "🚀 Deployment completed!"
    Write-Host "🌐 Your application is available at: http://localhost:3000" -ForegroundColor Green
    Write-Host "📊 To view logs: docker-compose logs -f kindergarten-race" -ForegroundColor Yellow
    Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Yellow
}

function Start-Development {
    Write-Status "Starting development environment..."
    docker-compose --profile dev up kindergarten-race-dev
}

function Stop-Application {
    Write-Status "Stopping application..."
    docker-compose down
    Write-Success "Application stopped"
}

function Show-Logs {
    Write-Status "Showing application logs..."
    docker-compose logs -f kindergarten-race
}

function Build-Only {
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Build-Application)) { exit 1 }
    if (-not (Build-DockerImage)) { exit 1 }
    Write-Success "Build completed"
}

function Show-Help {
    Write-Host "Usage: .\deploy.ps1 [COMMAND]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  (no command)  Deploy production application" -ForegroundColor Gray
    Write-Host "  dev          Start development environment" -ForegroundColor Gray
    Write-Host "  stop         Stop the application" -ForegroundColor Gray
    Write-Host "  logs         View application logs" -ForegroundColor Gray
    Write-Host "  build-only   Build application and Docker image only" -ForegroundColor Gray
    Write-Host "  help         Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\deploy.ps1           # Deploy to production" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 dev       # Start development server" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 stop      # Stop the application" -ForegroundColor Gray
}

# Main script logic
switch ($Command) {
    "dev" { Start-Development }
    "stop" { Stop-Application }
    "logs" { Show-Logs }
    "build-only" { Build-Only }
    "help" { Show-Help }
    "" { Deploy-Production }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host "Use '.\deploy.ps1 help' for usage information" -ForegroundColor Yellow
        exit 1
    }
}