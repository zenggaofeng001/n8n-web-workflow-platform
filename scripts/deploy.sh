#!/bin/bash

# N8N Web工作流平台部署脚本
# 作者: N8N Web Platform Team
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    # 检查Node.js版本
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js版本过低，需要18+版本"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 创建环境变量文件
create_env_files() {
    log_info "创建环境变量文件..."
    
    # 主环境变量文件
    if [ ! -f .env ]; then
        cat > .env << EOF
# 数据库配置
POSTGRES_PASSWORD=n8n_platform_secure_password
DATABASE_URL=postgresql://n8n_platform:n8n_platform_secure_password@localhost:5432/n8n_platform

# Redis配置
REDIS_PASSWORD=redis_secure_password

# JWT配置
JWT_SECRET=$(openssl rand -base64 32)

# N8N配置
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123

# 前端配置
FRONTEND_URL=http://localhost:3000

# 监控配置
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin123

# 环境
NODE_ENV=production
EOF
        log_success "创建了 .env 文件"
    else
        log_warning ".env 文件已存在，跳过创建"
    fi
    
    # 前端环境变量
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_N8N_URL=http://localhost:5679
VITE_SOCKET_URL=http://localhost:8000
VITE_MCP_URL=http://localhost:9000
EOF
        log_success "创建了前端 .env 文件"
    fi
    
    # 后端环境变量
    if [ ! -f backend/.env ]; then
        cp .env backend/.env
        log_success "创建了后端 .env 文件"
    fi
    
    # MCP集成环境变量
    if [ ! -f mcp-integration/.env ]; then
        cp .env mcp-integration/.env
        log_success "创建了MCP集成 .env 文件"
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd frontend
    npm install
    cd ..
    log_success "前端依赖安装完成"
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    npm install
    cd ..
    log_success "后端依赖安装完成"
    
    # 安装MCP集成依赖
    log_info "安装MCP集成依赖..."
    cd mcp-integration
    npm install
    npm run setup  # 安装N8N MCP服务器和工作流库
    cd ..
    log_success "MCP集成依赖安装完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建前端
    log_info "构建前端应用..."
    cd frontend
    npm run build
    cd ..
    log_success "前端构建完成"
    
    # 构建后端
    log_info "构建后端应用..."
    cd backend
    npm run build
    cd ..
    log_success "后端构建完成"
    
    # 构建MCP集成
    log_info "构建MCP集成服务..."
    cd mcp-integration
    npm run build
    cd ..
    log_success "MCP集成构建完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    # 等待PostgreSQL启动
    log_info "等待PostgreSQL启动..."
    sleep 10
    
    # 运行数据库迁移
    cd backend
    npx prisma migrate deploy
    npx prisma generate
    
    # 运行种子数据
    if [ -f "src/scripts/seed.ts" ]; then
        npm run db:seed
        log_success "种子数据导入完成"
    fi
    
    cd ..
    log_success "数据库初始化完成"
}

# 启动服务
start_services() {
    log_info "启动Docker服务..."
    
    cd docker
    
    # 拉取最新镜像
    docker-compose pull
    
    # 启动服务
    docker-compose up -d
    
    cd ..
    
    log_success "Docker服务启动完成"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    # 检查PostgreSQL
    if docker-compose -f docker/docker-compose.yml exec -T postgres pg_isready -U n8n_platform -d n8n_platform > /dev/null 2>&1; then
        log_success "PostgreSQL 运行正常"
    else
        log_error "PostgreSQL 启动失败"
        return 1
    fi
    
    # 检查Redis
    if docker-compose -f docker/docker-compose.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis 运行正常"
    else
        log_error "Redis 启动失败"
        return 1
    fi
    
    # 检查N8N
    if curl -f http://localhost:5679/healthz > /dev/null 2>&1; then
        log_success "N8N 运行正常"
    else
        log_warning "N8N 可能还在启动中..."
    fi
    
    # 检查后端API
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端API 运行正常"
    else
        log_warning "后端API 可能还在启动中..."
    fi
    
    # 检查前端
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "前端应用 运行正常"
    else
        log_warning "前端应用 可能还在启动中..."
    fi
    
    # 检查MCP集成
    if curl -f http://localhost:9000/health > /dev/null 2>&1; then
        log_success "MCP集成服务 运行正常"
    else
        log_warning "MCP集成服务 可能还在启动中..."
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "=========================================="
    echo "  N8N Web工作流平台 部署信息"
    echo "=========================================="
    echo ""
    echo "🌐 服务访问地址:"
    echo "   前端应用:     http://localhost:3000"
    echo "   后端API:      http://localhost:8000"
    echo "   N8N实例:      http://localhost:5679"
    echo "   MCP集成:      http://localhost:9000"
    echo "   Grafana监控:  http://localhost:3001"
    echo "   Prometheus:   http://localhost:9090"
    echo ""
    echo "🔐 默认登录信息:"
    echo "   N8N:          admin / admin123"
    echo "   Grafana:      admin / admin123"
    echo ""
    echo "📊 数据库连接:"
    echo "   PostgreSQL:   localhost:5432"
    echo "   Redis:        localhost:6379"
    echo ""
    echo "🛠️  管理命令:"
    echo "   查看日志:     docker-compose -f docker/docker-compose.yml logs -f"
    echo "   停止服务:     docker-compose -f docker/docker-compose.yml down"
    echo "   重启服务:     docker-compose -f docker/docker-compose.yml restart"
    echo "   查看状态:     docker-compose -f docker/docker-compose.yml ps"
    echo ""
    echo "📚 文档地址:"
    echo "   项目文档:     ./docs/"
    echo "   API文档:      http://localhost:8000/api/docs"
    echo ""
    echo "=========================================="
}

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    # 清理逻辑
}

# 主函数
main() {
    echo "=========================================="
    echo "  N8N Web工作流平台 自动部署脚本"
    echo "  版本: 1.0.0"
    echo "=========================================="
    echo ""
    
    # 检查参数
    SKIP_BUILD=false
    SKIP_DEPS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --skip-build    跳过构建步骤"
                echo "  --skip-deps     跳过依赖安装"
                echo "  --help          显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行部署步骤
    check_requirements
    create_env_files
    
    if [ "$SKIP_DEPS" = false ]; then
        install_dependencies
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_project
    fi
    
    start_services
    init_database
    show_deployment_info
    
    # 设置清理陷阱
    trap cleanup EXIT
}

# 运行主函数
main "$@"
