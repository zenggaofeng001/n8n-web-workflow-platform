@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM N8N Web Workflow Platform Deployment Script (Windows)
REM Author: N8N Web Platform Team
REM Version: 1.0.0

title N8N Web Workflow Platform - Auto Deploy

echo ==========================================
echo   N8N Web Workflow Platform Auto Deploy
echo   Version: 1.0.0 (Windows)
echo ==========================================
echo.

REM Check administrator privileges
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Please run this script as administrator
    pause
    exit /b 1
)

REM Check system requirements
echo [INFO] Checking system requirements...

REM Check Docker Desktop
docker --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Docker Desktop is not installed or not running
    echo Please install and start Docker Desktop first
    pause
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Docker Compose is not installed
    echo Please ensure Docker Desktop includes Docker Compose
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18+ first
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

REM Check Git
git --version >nul 2>&1
if !errorLevel! neq 0 (
    echo [ERROR] Git is not installed
    echo Please install Git first
    pause
    exit /b 1
)

echo [SUCCESS] System requirements check passed

REM Create environment variables file
echo [INFO] Creating environment variables file...

if not exist .env (
    echo # Database Configuration > .env
    echo POSTGRES_PASSWORD=n8n_platform_secure_password >> .env
    echo DATABASE_URL=postgresql://n8n_platform:n8n_platform_secure_password@localhost:5432/n8n_platform >> .env
    echo. >> .env
    echo # Redis Configuration >> .env
    echo REDIS_PASSWORD=redis_secure_password >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo. >> .env
    echo # N8N Configuration >> .env
    echo N8N_BASIC_AUTH_USER=admin >> .env
    echo N8N_BASIC_AUTH_PASSWORD=admin123 >> .env
    echo. >> .env
    echo # Frontend Configuration >> .env
    echo FRONTEND_URL=http://localhost:3000 >> .env
    echo. >> .env
    echo # Monitoring Configuration >> .env
    echo GRAFANA_USER=admin >> .env
    echo GRAFANA_PASSWORD=admin123 >> .env
    echo. >> .env
    echo # Environment >> .env
    echo NODE_ENV=production >> .env

    echo [SUCCESS] Created .env file
) else (
    echo [WARNING] .env file already exists, skipping creation
)

REM 创建前端环境变量
if not exist frontend\.env (
    echo VITE_API_URL=http://localhost:8000 > frontend\.env
    echo VITE_N8N_URL=http://localhost:5679 >> frontend\.env
    echo VITE_SOCKET_URL=http://localhost:8000 >> frontend\.env
    echo VITE_MCP_URL=http://localhost:9000 >> frontend\.env
    echo %GREEN%[SUCCESS]%NC% 创建了前端 .env 文件
)

REM 创建后端环境变量
if not exist backend\.env (
    copy .env backend\.env >nul
    echo %GREEN%[SUCCESS]%NC% 创建了后端 .env 文件
)

REM 创建MCP集成环境变量
if not exist mcp-integration\.env (
    copy .env mcp-integration\.env >nul
    echo %GREEN%[SUCCESS]%NC% 创建了MCP集成 .env 文件
)

REM 安装依赖
echo %BLUE%[INFO]%NC% 安装项目依赖...

REM 安装前端依赖
echo %BLUE%[INFO]%NC% 安装前端依赖...
cd frontend
call npm install
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo %GREEN%[SUCCESS]%NC% 前端依赖安装完成

REM 安装后端依赖
echo %BLUE%[INFO]%NC% 安装后端依赖...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 后端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo %GREEN%[SUCCESS]%NC% 后端依赖安装完成

REM 安装MCP集成依赖
echo %BLUE%[INFO]%NC% 安装MCP集成依赖...
cd mcp-integration
call npm install
call npm run setup
if %errorLevel% neq 0 (
    echo %YELLOW%[WARNING]%NC% MCP集成设置可能失败，但继续部署
)
cd ..
echo %GREEN%[SUCCESS]%NC% MCP集成依赖安装完成

REM 构建项目
echo %BLUE%[INFO]%NC% 构建项目...

REM 构建前端
echo %BLUE%[INFO]%NC% 构建前端应用...
cd frontend
call npm run build
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo %GREEN%[SUCCESS]%NC% 前端构建完成

REM 构建后端
echo %BLUE%[INFO]%NC% 构建后端应用...
cd backend
call npm run build
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 后端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo %GREEN%[SUCCESS]%NC% 后端构建完成

REM 构建MCP集成
echo %BLUE%[INFO]%NC% 构建MCP集成服务...
cd mcp-integration
call npm run build
if %errorLevel% neq 0 (
    echo %YELLOW%[WARNING]%NC% MCP集成构建失败，但继续部署
)
cd ..
echo %GREEN%[SUCCESS]%NC% MCP集成构建完成

REM 启动Docker服务
echo %BLUE%[INFO]%NC% 启动Docker服务...
cd docker

REM 拉取最新镜像
docker-compose pull

REM 启动服务
docker-compose up -d
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Docker服务启动失败
    cd ..
    pause
    exit /b 1
)

cd ..
echo %GREEN%[SUCCESS]%NC% Docker服务启动完成

REM 等待服务启动
echo %BLUE%[INFO]%NC% 等待服务启动...
timeout /t 30 /nobreak >nul

REM 初始化数据库
echo %BLUE%[INFO]%NC% 初始化数据库...
cd backend

REM 等待PostgreSQL启动
echo %BLUE%[INFO]%NC% 等待PostgreSQL启动...
timeout /t 10 /nobreak >nul

REM 运行数据库迁移
call npx prisma migrate deploy
call npx prisma generate

REM 运行种子数据
if exist "src\scripts\seed.ts" (
    call npm run db:seed
    echo %GREEN%[SUCCESS]%NC% 种子数据导入完成
)

cd ..
echo %GREEN%[SUCCESS]%NC% 数据库初始化完成

REM 检查服务健康状态
echo %BLUE%[INFO]%NC% 检查服务健康状态...

REM 等待服务完全启动
timeout /t 20 /nobreak >nul

REM 显示部署信息
echo.
echo %GREEN%[SUCCESS]%NC% 部署完成！
echo.
echo ==========================================
echo   N8N Web工作流平台 部署信息
echo ==========================================
echo.
echo 🌐 服务访问地址:
echo    前端应用:     http://localhost:3000
echo    后端API:      http://localhost:8000
echo    N8N实例:      http://localhost:5679
echo    MCP集成:      http://localhost:9000
echo    Grafana监控:  http://localhost:3001
echo    Prometheus:   http://localhost:9090
echo.
echo 🔐 默认登录信息:
echo    N8N:          admin / admin123
echo    Grafana:      admin / admin123
echo.
echo 📊 数据库连接:
echo    PostgreSQL:   localhost:5432
echo    Redis:        localhost:6379
echo.
echo 🛠️  管理命令:
echo    查看日志:     docker-compose -f docker/docker-compose.yml logs -f
echo    停止服务:     docker-compose -f docker/docker-compose.yml down
echo    重启服务:     docker-compose -f docker/docker-compose.yml restart
echo    查看状态:     docker-compose -f docker/docker-compose.yml ps
echo.
echo 📚 文档地址:
echo    项目文档:     ./docs/
echo    API文档:      http://localhost:8000/api/docs
echo.
echo ==========================================
echo.

REM 询问是否打开浏览器
set /p "open_browser=是否打开浏览器访问前端应用? (y/n): "
if /i "!open_browser!"=="y" (
    start http://localhost:3000
)

echo.
echo 部署完成！按任意键退出...
pause >nul
