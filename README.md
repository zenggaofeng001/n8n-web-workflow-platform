# 🚀 N8N Web工作流在线调试平台

<div align="center">

![N8N Platform](https://via.placeholder.com/600x200/4F46E5/FFFFFF?text=N8N+Web+Workflow+Platform)

**全功能的N8N工作流在线Web调试平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.10.0-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-%3E%3D18.0.0-61DAFB)](https://reactjs.org/)

[🚀 快速开始](#-快速开始) • [✨ 功能特性](#-核心功能) • [📖 文档](#-文档) • [🤝 贡献](#-贡献指南)

</div>

---

## 📋 项目概述

N8N Web工作流平台是一个**全功能的在线工作流调试和管理平台**，专为N8N工作流自动化而设计。该平台集成了**智能节点推荐**、**Docker深度集成**、**AI辅助开发**、**实时团队协作**等先进功能，基于现有**2000+工作流JSON源码**构建智能推荐系统。

### 🎯 核心价值

- **🧠 AI驱动**: 智能节点推荐和工作流优化建议
- **🐳 Docker集成**: 与本地N8N实例(5679:5678)无缝对接
- **👥 团队协作**: 实时多用户协作编辑工作流
- **📊 深度分析**: 工作流性能监控和智能调试
- **🔧 MCP集成**: 完整的Model Context Protocol支持
- **📚 模板库**: 2000+预构建工作流模板库

## ✨ 核心功能

### 🎨 智能工作流编辑器
- **可视化编辑**: 基于React Flow的拖拽式工作流编辑器
- **实时预览**: 工作流逻辑实时预览和验证
- **代码视图**: JSON配置的代码编辑模式
- **智能提示**: AI驱动的节点配置建议

### 🧠 AI智能推荐系统
- **节点智能推荐**: 基于需求描述自动推荐最适合的节点
- **语义相似性匹配**: 使用NLP技术进行智能节点匹配
- **使用模式分析**: 基于历史数据的节点组合推荐
- **上下文感知**: 根据当前工作流上下文提供精准建议

### 🐳 Docker深度集成
- **无缝对接**: 与本地Docker N8N实例(5679:5678)完美集成
- **实时同步**: 工作流变更实时同步到N8N容器
- **容器管理**: 自动化的N8N容器部署和管理
- **环境隔离**: 完整的开发、测试、生产环境隔离

### 🤖 MCP服务集成
- **N8N MCP服务器**: 集成leonardsellem/n8n-mcp-server
- **工作流库**: 集成Zie619/n8n-workflows的2000+工作流模板
- **智能分析**: AI驱动的工作流分析和优化建议
- **实时通信**: 基于Socket.IO的实时MCP服务通信

### 👥 团队协作功能
- **实时协作**: 多用户同时编辑工作流
- **权限管理**: 细粒度的用户权限控制
- **版本控制**: 完整的工作流版本历史和回滚
- **评论系统**: 工作流节点级别的评论和反馈

### 📊 监控与分析
- **实时监控**: 工作流执行状态实时监控
- **性能分析**: 执行时间、成功率、错误分析
- **资源监控**: CPU、内存、网络使用情况
- **告警系统**: 异常情况自动告警通知

## 🚀 快速开始

### 📋 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Docker Desktop | 20.10.0+ | 24.0.0+ |
| Node.js | 18.0.0+ | 20.0.0+ |
| npm | 9.0.0+ | 10.0.0+ |
| 内存 | 4GB | 8GB+ |
| 存储空间 | 20GB | 50GB+ |

### ⚡ 一键部署

#### Windows用户
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/n8n-web-workflow-platform.git
cd n8n-web-workflow-platform

# 2. 运行部署脚本
scripts\deploy.bat
```

#### Linux/macOS用户
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/n8n-web-workflow-platform.git
cd n8n-web-workflow-platform

# 2. 给脚本执行权限并运行
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 🌐 访问服务

部署完成后，通过以下地址访问各项服务：

| 服务 | 地址 | 用途 |
|------|------|------|
| 🎨 前端应用 | http://localhost:3000 | 主要的Web界面 |
| 🔧 N8N实例 | http://localhost:5679 | N8N工作流编辑器 |
| 🚀 后端API | http://localhost:8000 | REST API服务 |
| 🤖 MCP集成 | http://localhost:9000 | MCP服务接口 |
| 📊 监控面板 | http://localhost:3001 | Grafana监控 |

### 🔐 默认登录信息

| 服务 | 用户名 | 密码 |
|------|--------|------|
| N8N实例 | admin | admin123 |
| Grafana监控 | admin | admin123 |

## 🏗️ 技术架构

### 🎨 前端技术栈
```
React 18 + TypeScript + Vite
├── React Flow          # 工作流可视化编辑
├── Tailwind CSS        # 实用优先的样式框架
├── Zustand            # 轻量级状态管理
├── Monaco Editor      # 代码编辑器
├── Socket.IO Client   # 实时通信
└── Radix UI           # 无障碍UI组件库
```

### 🚀 后端技术栈
```
Node.js + Express + TypeScript
├── Prisma             # 现代化数据库ORM
├── PostgreSQL         # 关系型数据库
├── Redis              # 缓存和会话存储
├── Socket.IO          # 实时通信服务
├── Winston            # 日志管理
└── Bull               # 任务队列
```

### 🤖 MCP集成服务
```
Model Context Protocol
├── N8N MCP Server     # 核心MCP服务器
├── 智能推荐引擎        # AI驱动的节点推荐
├── 工作流分析器        # 深度学习工作流优化
├── 自然语言处理        # 智能需求理解
└── 实时同步服务        # 与Docker N8N同步
```

### 🐳 容器化部署
```
Docker Compose
├── Frontend           # React应用容器
├── Backend            # Node.js API容器
├── N8N Instance       # N8N工作流引擎
├── PostgreSQL         # 数据库容器
├── Redis              # 缓存容器
├── MCP Integration    # MCP服务容器
├── Nginx              # 反向代理
└── Monitoring         # Prometheus + Grafana
```

## 🎯 使用指南

### 1️⃣ 创建工作流
```bash
1. 访问前端应用 → http://localhost:3000
2. 点击"新建工作流"按钮
3. 从左侧节点库拖拽所需节点
4. 配置节点参数和连接关系
5. 使用AI助手获取配置建议
6. 保存并测试工作流
```

### 2️⃣ 智能节点推荐
```bash
1. 在工作流编辑器中右键点击空白区域
2. 选择"智能推荐节点"选项
3. 输入需求描述（支持中英文）
4. 查看AI推荐的节点列表和使用建议
5. 点击添加推荐的节点到工作流
```

### 3️⃣ Docker N8N集成
```bash
1. 确保本地N8N容器运行在5679端口
2. 在平台中点击"同步到N8N"按钮
3. 工作流将自动部署到N8N实例
4. 在N8N界面中查看和执行工作流
5. 实时监控执行状态和日志
```

### 4️⃣ 团队协作
```bash
1. 在工作流详情页点击"协作"按钮
2. 添加团队成员邮箱地址
3. 设置权限级别（查看者/编辑者/所有者）
4. 团队成员可实时协作编辑工作流
5. 查看协作历史和版本变更
```

## 📦 项目结构

```
n8n-web-workflow-platform/
├── 📁 frontend/                    # React前端应用
│   ├── src/
│   │   ├── components/             # React组件库
│   │   ├── pages/                  # 页面组件
│   │   ├── stores/                 # Zustand状态管理
│   │   ├── services/               # API服务层
│   │   ├── types/                  # TypeScript类型定义
│   │   └── utils/                  # 工具函数
│   └── package.json
├── 📁 backend/                     # Node.js后端服务
│   ├── src/
│   │   ├── controllers/            # 控制器层
│   │   ├── services/               # 业务逻辑层
│   │   ├── routes/                 # 路由定义
│   │   ├── middleware/             # 中间件
│   │   └── utils/                  # 工具函数
│   ├── prisma/                     # 数据库Schema
│   └── package.json
├── 📁 mcp-integration/             # MCP集成服务
│   ├── src/
│   │   ├── services/               # MCP服务实现
│   │   ├── routes/                 # API路由
│   │   └── utils/                  # 工具函数
│   └── package.json
├── 📁 docker/                      # Docker配置
│   ├── docker-compose.yml          # 容器编排配置
│   ├── nginx/                      # Nginx配置
│   └── monitoring/                 # 监控配置
├── 📁 scripts/                     # 部署脚本
│   ├── deploy.sh                   # Linux/macOS部署
│   └── deploy.bat                  # Windows部署
├── 📁 docs/                        # 项目文档
└── 📄 README.md                    # 项目说明
```

## 🚀 快速开始

### 系统要求
- Docker 20.10.0 或更高版本
- Node.js 18.x 或更高版本
- 内存：至少 4GB RAM
- 存储空间：至少 20GB 可用空间

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd n8n-web-workflow-platform
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd ../backend && npm install

# 安装MCP集成依赖
cd ../mcp-integration && npm install
```

3. **启动Docker服务**
```bash
# 启动所有服务
docker-compose up -d

# 验证N8N服务
curl http://localhost:5679/healthz
```

4. **初始化数据库**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **启动开发服务器**
```bash
# 启动后端服务
cd backend && npm run dev

# 启动前端服务
cd frontend && npm run dev

# 启动MCP服务
cd mcp-integration && npm run start
```

6. **访问应用**
- 前端界面: http://localhost:3000
- 后端API: http://localhost:8000
- N8N实例: http://localhost:5679

## 📚 使用指南

### 创建工作流
1. 点击"新建工作流"按钮
2. 从节点库中拖拽所需节点
3. 配置节点参数和连接
4. 使用AI助手获取配置建议
5. 保存并测试工作流

### Docker集成
1. 确保本地N8N容器运行在5679端口
2. 在平台中点击"同步到N8N"
3. 工作流将自动部署到N8N实例
4. 实时监控执行状态和日志

### 智能调试
1. 工作流执行出错时，系统自动诊断
2. 查看详细的错误分析报告
3. 应用AI推荐的修复方案
4. 重新测试验证修复效果

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

# 运行数据库迁移
npx prisma migrate dev

# 重置数据库
npx prisma migrate reset

# 查看数据库内容
npx prisma studio

# 生成Prisma客户端
npx prisma generate
```

### 应用开发
```bash
# 前端开发模式
cd frontend && npm run dev

# 后端开发模式
cd backend && npm run dev

# MCP集成开发模式
cd mcp-integration && npm run dev

# 构建生产版本
npm run build
```

## 📚 文档

| 文档 | 描述 |
|------|------|
| [📖 快速开始指南](./docs/QUICK_START_GUIDE.md) | 详细的安装和使用指南 |
| [🏗️ 架构设计](./docs/ARCHITECTURE.md) | 系统架构和技术选型 |
| [🔧 开发指南](./docs/DEVELOPMENT_GUIDE.md) | 开发环境设置和规范 |
| [🚀 部署指南](./docs/DEPLOYMENT_GUIDE.md) | 生产环境部署说明 |
| [📊 API文档](./docs/API_DOCUMENTATION.md) | REST API接口文档 |
| [🐛 故障排除](./docs/TROUBLESHOOTING.md) | 常见问题和解决方案 |

## 🌟 功能特性对比

| 功能 | 传统N8N | 本平台 | 优势 |
|------|---------|--------|------|
| 工作流编辑 | ✅ | ✅ | 增强的UI/UX |
| 节点推荐 | ❌ | ✅ | AI智能推荐 |
| 模板库 | 基础 | ✅ | 2000+模板 |
| 团队协作 | 有限 | ✅ | 实时协作 |
| 版本控制 | 基础 | ✅ | 完整版本管理 |
| 监控分析 | 基础 | ✅ | 深度分析 |
| Docker集成 | 手动 | ✅ | 自动化集成 |
| MCP支持 | ❌ | ✅ | 原生MCP支持 |

## 🤝 贡献指南

我们欢迎社区贡献！请查看以下资源：

- [贡献指南](./CONTRIBUTING.md)
- [开发环境设置](./docs/DEVELOPMENT_GUIDE.md)
- [代码规范](./docs/CODE_STANDARDS.md)
- [问题报告](https://github.com/your-repo/issues)

## 📞 联系我们

- **项目主页**: https://github.com/your-repo/n8n-web-workflow-platform
- **文档站点**: https://docs.your-domain.com
- **技术支持**: support@your-domain.com
- **社区讨论**: https://discord.gg/your-invite

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](./LICENSE) 文件。

## 🎉 致谢

感谢以下开源项目和社区的支持：

- [N8N](https://n8n.io/) - 强大的工作流自动化平台
- [React Flow](https://reactflow.dev/) - 优秀的流程图库
- [Prisma](https://www.prisma.io/) - 现代化的数据库工具
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI工具标准协议

---

<div align="center">

**让工作流自动化变得更简单、更智能！** 🚀

**项目状态**: ✅ 生产就绪 | **最后更新**: 2025年1月17日 | **维护团队**: N8N Web Platform开发团队

[![Star on GitHub](https://img.shields.io/github/stars/your-repo/n8n-web-workflow-platform?style=social)](https://github.com/your-repo/n8n-web-workflow-platform)
[![Fork on GitHub](https://img.shields.io/github/forks/your-repo/n8n-web-workflow-platform?style=social)](https://github.com/your-repo/n8n-web-workflow-platform/fork)

</div>
