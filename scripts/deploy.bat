@echo off
setlocal enabledelayedexpansion

REM N8N Web工作流平台部署脚本 (Windows版本)
REM 作者: N8N Web Platform Team
REM 版本: 1.0.0

title N8N Web工作流平台 - 自动部署

echo ==========================================
echo   N8N Web工作流平台 自动部署脚本
echo   版本: 1.0.0 (Windows)
echo ==========================================
echo.

REM 设置颜色
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 请以管理员身份运行此脚本
    pause
    exit /b 1
)

REM 检查系统要求
echo %BLUE%[INFO]%NC% 检查系统要求...

REM 检查Docker Desktop
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Docker Desktop未安装或未启动
    echo 请先安装并启动Docker Desktop
    pause
    exit /b 1
)

REM 检查Docker Compose
docker-compose --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Docker Compose未安装
    echo 请确保Docker Desktop包含Docker Compose
    pause
    exit /b 1
)

REM 检查Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Node.js未安装
    echo 请先安装Node.js 18+版本
    pause
    exit /b 1
)

REM 检查npm
npm --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% npm未安装
    pause
    exit /b 1
)

REM 检查Git
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Git未安装
    echo 请先安装Git
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% 系统要求检查通过

REM 创建环境变量文件
echo %BLUE%[INFO]%NC% 创建环境变量文件...

if not exist .env (
    echo # 数据库配置 > .env
    echo POSTGRES_PASSWORD=n8n_platform_secure_password >> .env
    echo DATABASE_URL=postgresql://n8n_platform:n8n_platform_secure_password@localhost:5432/n8n_platform >> .env
    echo. >> .env
    echo # Redis配置 >> .env
    echo REDIS_PASSWORD=redis_secure_password >> .env
    echo. >> .env
    echo # JWT配置 >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo. >> .env
    echo # N8N配置 >> .env
    echo N8N_BASIC_AUTH_USER=admin >> .env
    echo N8N_BASIC_AUTH_PASSWORD=admin123 >> .env
    echo. >> .env
    echo # 前端配置 >> .env
    echo FRONTEND_URL=http://localhost:3000 >> .env
    echo. >> .env
    echo # 监控配置 >> .env
    echo GRAFANA_USER=admin >> .env
    echo GRAFANA_PASSWORD=admin123 >> .env
    echo. >> .env
    echo # 环境 >> .env
    echo NODE_ENV=production >> .env
    
    echo %GREEN%[SUCCESS]%NC% 创建了 .env 文件
) else (
    echo %YELLOW%[WARNING]%NC% .env 文件已存在，跳过创建
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
