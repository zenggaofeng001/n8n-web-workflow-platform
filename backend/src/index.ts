import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// 导入路由
import authRoutes from './routes/auth'
import workflowRoutes from './routes/workflows'
import nodeTypesRoutes from './routes/nodeTypes'
import executionRoutes from './routes/executions'
import templateRoutes from './routes/templates'
import collaborationRoutes from './routes/collaboration'
import dockerRoutes from './routes/docker'
import mcpRoutes from './routes/mcp'

// 导入中间件
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { authMiddleware } from './middleware/auth'
import { requestLogger } from './middleware/requestLogger'

// 导入服务
import { WorkflowService } from './services/WorkflowService'
import { ExecutionService } from './services/ExecutionService'
import { DockerService } from './services/DockerService'
import { MCPService } from './services/MCPService'
import { RealtimeService } from './services/RealtimeService'
import { logger } from './utils/logger'

// 加载环境变量
dotenv.config()

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// 初始化数据库和Redis
const prisma = new PrismaClient()
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// 初始化服务
const workflowService = new WorkflowService(prisma, redis)
const executionService = new ExecutionService(prisma, redis)
const dockerService = new DockerService()
const mcpService = new MCPService()
const realtimeService = new RealtimeService(io, prisma, redis)

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }))
}

app.use(requestLogger)

// 速率限制
app.use('/api', rateLimiter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/workflows', authMiddleware, workflowRoutes)
app.use('/api/node-types', authMiddleware, nodeTypesRoutes)
app.use('/api/executions', authMiddleware, executionRoutes)
app.use('/api/templates', authMiddleware, templateRoutes)
app.use('/api/collaboration', authMiddleware, collaborationRoutes)
app.use('/api/docker', authMiddleware, dockerRoutes)
app.use('/api/mcp', authMiddleware, mcpRoutes)

// Socket.IO连接处理
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  // 加入工作流房间
  socket.on('join-workflow', (workflowId: string) => {
    socket.join(`workflow:${workflowId}`)
    logger.info(`Client ${socket.id} joined workflow ${workflowId}`)
  })

  // 离开工作流房间
  socket.on('leave-workflow', (workflowId: string) => {
    socket.leave(`workflow:${workflowId}`)
    logger.info(`Client ${socket.id} left workflow ${workflowId}`)
  })

  // 工作流实时编辑
  socket.on('workflow-update', async (data) => {
    try {
      const { workflowId, changes, userId } = data
      
      // 广播更改到其他客户端
      socket.to(`workflow:${workflowId}`).emit('workflow-changed', {
        changes,
        userId,
        timestamp: new Date().toISOString(),
      })

      // 保存更改到数据库
      await realtimeService.handleWorkflowUpdate(workflowId, changes, userId)
    } catch (error) {
      logger.error('Error handling workflow update:', error)
      socket.emit('error', { message: 'Failed to update workflow' })
    }
  })

  // 工作流执行状态更新
  socket.on('execution-status', (data) => {
    const { workflowId, executionId, status } = data
    socket.to(`workflow:${workflowId}`).emit('execution-status-changed', {
      executionId,
      status,
      timestamp: new Date().toISOString(),
    })
  })

  // 协作光标位置
  socket.on('cursor-position', (data) => {
    const { workflowId, position, userId } = data
    socket.to(`workflow:${workflowId}`).emit('cursor-moved', {
      position,
      userId,
      socketId: socket.id,
    })
  })

  // 断开连接
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// 错误处理中间件
app.use(errorHandler)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
  })
})

// 启动服务器
const PORT = process.env.PORT || 8000

async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect()
    logger.info('Connected to database')

    // 测试Redis连接
    await redis.ping()
    logger.info('Connected to Redis')

    // 初始化Docker服务
    await dockerService.initialize()
    logger.info('Docker service initialized')

    // 初始化MCP服务
    await mcpService.initialize()
    logger.info('MCP service initialized')

    // 启动服务器
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  server.close(() => {
    logger.info('HTTP server closed')
  })

  await prisma.$disconnect()
  logger.info('Database connection closed')

  redis.disconnect()
  logger.info('Redis connection closed')

  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  server.close(() => {
    logger.info('HTTP server closed')
  })

  await prisma.$disconnect()
  logger.info('Database connection closed')

  redis.disconnect()
  logger.info('Redis connection closed')

  process.exit(0)
})

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// 启动服务器
startServer()

export { app, io, prisma, redis }
