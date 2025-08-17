@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title N8N Web Workflow Platform - Simple Deploy

echo ==========================================
echo   N8N Web Workflow Platform Simple Deploy
echo   Version: 1.0.0
echo ==========================================
echo.

echo [INFO] Starting deployment...

REM Check Docker
docker --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo [SUCCESS] Docker is available

REM Check if .env exists, if not copy from example
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [SUCCESS] Created .env file from example
    ) else (
        echo [INFO] Creating basic .env file...
        echo NODE_ENV=production > .env
        echo POSTGRES_PASSWORD=n8n_secure_pass >> .env
        echo REDIS_PASSWORD=redis_secure_pass >> .env
        echo JWT_SECRET=your-jwt-secret-key >> .env
        echo N8N_BASIC_AUTH_USER=admin >> .env
        echo N8N_BASIC_AUTH_PASSWORD=admin123 >> .env
        echo FRONTEND_URL=http://localhost:3000 >> .env
        echo [SUCCESS] Created basic .env file
    )
) else (
    echo [INFO] .env file already exists
)

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
if exist package.json (
    call npm install
    if !errorLevel! neq 0 (
        echo [ERROR] Frontend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [WARNING] Frontend package.json not found, skipping
)
cd ..

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
if exist package.json (
    call npm install
    if !errorLevel! neq 0 (
        echo [ERROR] Backend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [WARNING] Backend package.json not found, skipping
)
cd ..

REM Install MCP integration dependencies
echo [INFO] Installing MCP integration dependencies...
cd mcp-integration
if exist package.json (
    call npm install
    if !errorLevel! neq 0 (
        echo [WARNING] MCP integration dependencies installation failed, continuing...
    ) else (
        echo [SUCCESS] MCP integration dependencies installed
    )
) else (
    echo [WARNING] MCP integration package.json not found, skipping
)
cd ..

REM Build frontend
echo [INFO] Building frontend...
cd frontend
if exist package.json (
    call npm run build
    if !errorLevel! neq 0 (
        echo [ERROR] Frontend build failed
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Frontend build completed
)
cd ..

REM Build backend
echo [INFO] Building backend...
cd backend
if exist package.json (
    call npm run build
    if !errorLevel! neq 0 (
        echo [ERROR] Backend build failed
        cd ..
        pause
        exit /b 1
    )
    echo [SUCCESS] Backend build completed
)
cd ..

REM Start Docker services
echo [INFO] Starting Docker services...
if exist docker-compose.dev.yml (
    echo [INFO] Using development compose file...
    docker-compose -f docker-compose.dev.yml pull
    docker-compose -f docker-compose.dev.yml up -d
    if !errorLevel! neq 0 (
        echo [ERROR] Docker services failed to start with dev compose
        echo [INFO] Trying with docker directory...
        cd docker
        if exist docker-compose.yml (
            docker-compose pull
            docker-compose up -d
            if !errorLevel! neq 0 (
                echo [ERROR] Docker services failed to start
                cd ..
                pause
                exit /b 1
            )
        ) else (
            echo [ERROR] docker-compose.yml not found in docker directory
            cd ..
            pause
            exit /b 1
        )
        cd ..
    )
    echo [SUCCESS] Docker services started
) else (
    echo [INFO] Development compose file not found, trying docker directory...
    cd docker
    if exist docker-compose.yml (
        docker-compose pull
        docker-compose up -d
        if !errorLevel! neq 0 (
            echo [ERROR] Docker services failed to start
            cd ..
            pause
            exit /b 1
        )
        echo [SUCCESS] Docker services started
    ) else (
        echo [ERROR] docker-compose.yml not found
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Initialize database
echo [INFO] Initializing database...
cd backend
if exist package.json (
    call npx prisma migrate deploy
    call npx prisma generate
    if exist "src\scripts\seed.ts" (
        call npm run db:seed
        echo [SUCCESS] Database seeded
    )
)
cd ..

echo.
echo [SUCCESS] Deployment completed!
echo.
echo ==========================================
echo   N8N Web Workflow Platform - Access Info
echo ==========================================
echo.
echo Services:
echo   Frontend:     http://localhost:3000
echo   Backend API:  http://localhost:8000
echo   N8N Instance: http://localhost:5679
echo   MCP Service:  http://localhost:9000
echo   Grafana:      http://localhost:3001
echo.
echo Default Login:
echo   N8N:          admin / admin123
echo   Grafana:      admin / admin123
echo.
echo Management Commands:
echo   View logs:    docker-compose -f docker/docker-compose.yml logs -f
echo   Stop services: docker-compose -f docker/docker-compose.yml down
echo   Restart:      docker-compose -f docker/docker-compose.yml restart
echo.
echo ==========================================
echo.

set /p "open_browser=Open browser to access the platform? (y/n): "
if /i "!open_browser!"=="y" (
    start http://localhost:3000
)

echo.
echo Deployment completed! Press any key to exit...
pause >nul
