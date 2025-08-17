# N8N Web工作流平台 - 快速开始指南

## 🚀 快速部署

### Windows用户

1. **一键部署**
```bash
# 克隆项目
git clone <repository-url>
cd n8n-web-workflow-platform

# 运行部署脚本
scripts\deploy.bat
```

2. **快速启动**（适用于已部署环境）
```bash
# 启动所有服务
quick-start.bat
```

### Linux/macOS用户

1. **一键部署**
```bash
# 克隆项目
git clone <repository-url>
cd n8n-web-workflow-platform

# 给脚本执行权限
chmod +x scripts/deploy.sh

# 运行部署脚本
./scripts/deploy.sh
```

2. **快速启动**
```bash
# 启动Docker服务
cd docker
docker-compose up -d
```

## 📋 系统要求

### 必需软件
- **Docker Desktop** 20.10.0+
- **Node.js** 18.0.0+
- **npm** 9.0.0+
- **Git** 2.30.0+

### 硬件要求
- **内存**: 最少 4GB RAM（推荐 8GB+）
- **存储**: 最少 20GB 可用空间
- **CPU**: 2核心以上（推荐 4核心+）

### 操作系统支持
- Windows 10/11 Pro 或 Enterprise
- Ubuntu 20.04 LTS+
- macOS 12.0+
- CentOS 8+
- Debian 11+

## 🌐 服务访问

部署完成后，您可以通过以下地址访问各项服务：

| 服务 | 地址 | 用途 |
|------|------|------|
| 前端应用 | http://localhost:3000 | 主要的Web界面 |
| N8N实例 | http://localhost:5679 | N8N工作流编辑器 |
| 后端API | http://localhost:8000 | REST API服务 |
| MCP集成 | http://localhost:9000 | MCP服务接口 |
| Grafana监控 | http://localhost:3001 | 系统监控面板 |
| Prometheus | http://localhost:9090 | 指标收集服务 |

## 🔐 默认登录信息

### N8N实例
- **用户名**: admin
- **密码**: admin123

### Grafana监控
- **用户名**: admin
- **密码**: admin123

## 📊 数据库连接信息

### PostgreSQL
- **主机**: localhost
- **端口**: 5432
- **数据库**: n8n_platform
- **用户名**: n8n_platform
- **密码**: 在.env文件中配置

### Redis
- **主机**: localhost
- **端口**: 6379
- **密码**: 在.env文件中配置

## 🎯 核心功能使用

### 1. 创建工作流

1. 访问前端应用 http://localhost:3000
2. 点击"新建工作流"按钮
3. 从左侧节点库拖拽所需节点
4. 配置节点参数和连接
5. 保存并测试工作流

### 2. 智能节点推荐

1. 在工作流编辑器中右键点击空白区域
2. 选择"智能推荐节点"
3. 输入需求描述
4. 查看AI推荐的节点列表
5. 点击添加推荐的节点

### 3. Docker N8N集成

1. 确保本地N8N容器运行在5679端口
2. 在平台中点击"同步到N8N"按钮
3. 工作流将自动部署到N8N实例
4. 在N8N界面中查看和执行工作流

### 4. 工作流模板使用

1. 点击"模板库"菜单
2. 浏览或搜索工作流模板
3. 点击"使用模板"按钮
4. 根据需要修改模板参数
5. 保存为新的工作流

### 5. 团队协作

1. 在工作流详情页点击"协作"按钮
2. 添加团队成员邮箱
3. 设置权限级别（查看者/编辑者/所有者）
4. 团队成员可实时协作编辑工作流

## 🛠️ 管理命令

### Docker服务管理

```bash
# 查看服务状态
docker-compose -f docker/docker-compose.yml ps

# 查看服务日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止所有服务
docker-compose -f docker/docker-compose.yml down

# 重启特定服务
docker-compose -f docker/docker-compose.yml restart [service-name]

# 重新构建并启动
docker-compose -f docker/docker-compose.yml up -d --build
```

### 数据库管理

```bash
# 进入后端目录
cd backend

# 查看数据库状态
npx prisma db push

# 运行数据库迁移
npx prisma migrate dev

# 重置数据库
npx prisma migrate reset

# 查看数据库内容
npx prisma studio
```

### 应用管理

```bash
# 前端开发模式
cd frontend
npm run dev

# 后端开发模式
cd backend
npm run dev

# MCP集成开发模式
cd mcp-integration
npm run dev

# 构建生产版本
npm run build
```

## 🔧 配置说明

### 环境变量配置

主要环境变量在 `.env` 文件中配置：

```env
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://...

# Redis配置
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret

# N8N配置
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_n8n_password

# 前端配置
FRONTEND_URL=http://localhost:3000
```

### 端口配置

如需修改默认端口，请编辑以下文件：

- **前端**: `frontend/vite.config.ts`
- **后端**: `backend/src/index.ts`
- **N8N**: `docker/docker-compose.yml`
- **数据库**: `docker/docker-compose.yml`

## 🚨 故障排除

### 常见问题

1. **Docker服务启动失败**
   - 检查Docker Desktop是否运行
   - 确认端口未被占用
   - 查看Docker日志：`docker-compose logs`

2. **数据库连接失败**
   - 等待PostgreSQL完全启动（约30秒）
   - 检查数据库密码配置
   - 重启数据库容器

3. **前端无法访问后端**
   - 检查后端服务是否启动
   - 确认API地址配置正确
   - 查看网络连接和防火墙设置

4. **N8N集成失败**
   - 确认N8N容器运行在5679端口
   - 检查N8N认证配置
   - 验证网络连接

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs -f [service-name]

# 查看应用日志
tail -f backend/logs/app.log
tail -f mcp-integration/logs/mcp.log
```

### 性能优化

1. **增加内存分配**
   - 修改Docker Desktop内存限制
   - 调整Node.js堆内存大小

2. **数据库优化**
   - 定期清理执行历史
   - 优化数据库索引
   - 配置连接池大小

3. **缓存优化**
   - 调整Redis内存配置
   - 设置合适的缓存过期时间

## 📚 更多资源

- [API文档](./API_DOCUMENTATION.md)
- [架构设计](./ARCHITECTURE.md)
- [开发指南](./DEVELOPMENT_GUIDE.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [故障排除](./TROUBLESHOOTING.md)

## 🤝 获取帮助

如果您遇到问题或需要帮助：

1. 查看[故障排除文档](./TROUBLESHOOTING.md)
2. 搜索[GitHub Issues](https://github.com/your-repo/issues)
3. 提交新的Issue报告问题
4. 联系技术支持团队

---

**祝您使用愉快！** 🎉
