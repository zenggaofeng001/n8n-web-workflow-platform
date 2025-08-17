@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title N8N Web Workflow Platform - Quick Start

echo ==========================================
echo   N8N Web Workflow Platform - Quick Start
echo ==========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Docker is not running, please start Docker Desktop first
    pause
    exit /b 1
)

echo [INFO] Starting N8N Web Workflow Platform...

REM Start all services using dev compose file
echo [INFO] Starting Docker containers...
docker-compose -f docker-compose.dev.yml up -d

if !errorLevel! neq 0 (
    echo [ERROR] Failed to start services
    echo [INFO] Trying with docker directory...
    cd docker
    docker-compose up -d
    if !errorLevel! neq 0 (
        echo [ERROR] Failed to start services from docker directory too
        pause
        exit /b 1
    )
    cd ..
)

echo [SUCCESS] Services started successfully!

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 20 /nobreak >nul

REM Show service status
echo.
echo [INFO] Service status:
docker-compose -f docker-compose.dev.yml ps 2>nul || (cd docker && docker-compose ps && cd ..)

echo.
echo [SUCCESS] N8N Web Workflow Platform is now running!
echo.
echo Access URLs:
echo    Frontend:     http://localhost:3000
echo    N8N Instance: http://localhost:5679
echo    Backend API:  http://localhost:8000
echo    MCP Service:  http://localhost:9000
echo    Monitoring:   http://localhost:3001
echo.
echo Login Info:
echo    N8N:          admin / admin123
echo    Grafana:      admin / admin123
echo.

REM Ask if user wants to open browser
set /p "open_browser=Open browser? (y/n): "
if /i "!open_browser!"=="y" (
    start http://localhost:3000
    start http://localhost:5679
)

echo.
echo Press any key to exit...
pause >nul

cd ..
