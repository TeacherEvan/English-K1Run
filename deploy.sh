#!/bin/bash

# Kubernetes Race Game - Quick Deploy Script
# This script automates the deployment process

set -e

echo "🎮 Kindergarten Race Game - Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Build the application
build_app() {
    print_status "Building React application..."
    if npm run build; then
        print_success "Application built successfully"
    else
        print_error "Failed to build application"
        exit 1
    fi
}

# Build Docker image
build_docker() {
    print_status "Building Docker image..."
    if docker build -t kindergarten-race-game .; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Deploy with Docker Compose
deploy() {
    print_status "Deploying with Docker Compose..."
    if docker-compose up -d kindergarten-race; then
        print_success "Application deployed successfully"
    else
        print_error "Failed to deploy application"
        exit 1
    fi
}

# Check application health
check_health() {
    print_status "Checking application health..."
    sleep 5
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Application is running and healthy"
    else
        print_warning "Application may not be ready yet. Please check manually at http://localhost:3000"
    fi
}

# Main deployment function
main() {
    echo
    print_status "Starting deployment process..."
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    
    # Build and deploy
    build_app
    build_docker
    deploy
    check_health
    
    echo
    print_success "🚀 Deployment completed!"
    echo "🌐 Your application is available at: http://localhost:3000"
    echo "📊 To view logs: docker-compose logs -f kindergarten-race"
    echo "🛑 To stop: docker-compose down"
}

# Handle script arguments
case "${1:-}" in
    "dev")
        print_status "Starting development environment..."
        docker-compose --profile dev up kindergarten-race-dev
        ;;
    "stop")
        print_status "Stopping application..."
        docker-compose down
        print_success "Application stopped"
        ;;
    "logs")
        print_status "Showing application logs..."
        docker-compose logs -f kindergarten-race
        ;;
    "build-only")
        check_docker
        build_app
        build_docker
        print_success "Build completed"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [COMMAND]"
        echo
        echo "Commands:"
        echo "  (no command)  Deploy production application"
        echo "  dev          Start development environment"
        echo "  stop         Stop the application"
        echo "  logs         View application logs"
        echo "  build-only   Build application and Docker image only"
        echo "  help         Show this help message"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac