@echo off
setlocal enabledelayedexpansion

REM N8N Web工作流平台 - 快速启动脚本
REM 适用于已经部署过的环境

title N8N Web工作流平台 - 快速启动

echo ==========================================
echo   N8N Web工作流平台 - 快速启动
echo ==========================================
echo.

REM 设置颜色
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM 检查Docker是否运行
docker info >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% Docker未运行，请先启动Docker Desktop
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% 启动N8N Web工作流平台...

REM 进入docker目录
cd docker

REM 启动所有服务
echo %BLUE%[INFO]%NC% 启动Docker容器...
docker-compose up -d

if %errorLevel% neq 0 (
    echo %RED%[ERROR]%NC% 服务启动失败
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%NC% 服务启动成功！

REM 等待服务启动
echo %BLUE%[INFO]%NC% 等待服务启动完成...
timeout /t 15 /nobreak >nul

REM 显示服务状态
echo.
echo %BLUE%[INFO]%NC% 服务状态:
docker-compose ps

echo.
echo %GREEN%[SUCCESS]%NC% N8N Web工作流平台已启动！
echo.
echo 🌐 访问地址:
echo    前端应用:     http://localhost:3000
echo    N8N实例:      http://localhost:5679
echo    后端API:      http://localhost:8000
echo    MCP集成:      http://localhost:9000
echo    监控面板:     http://localhost:3001
echo.
echo 🔐 登录信息:
echo    N8N:          admin / admin123
echo    Grafana:      admin / admin123
echo.

REM 询问是否打开浏览器
set /p "open_browser=是否打开浏览器? (y/n): "
if /i "!open_browser!"=="y" (
    start http://localhost:3000
    start http://localhost:5679
)

echo.
echo 按任意键退出...
pause >nul

cd ..
