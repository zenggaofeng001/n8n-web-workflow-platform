import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import Redis from 'ioredis'

// 导入MCP服务
import { N8NMCPServer } from './services/N8NMCPServer'
import { WorkflowLibraryService } from './services/WorkflowLibraryService'
import { SmartRecommenderService } from './services/SmartRecommenderService'
import { AIAssistantService } from './services/AIAssistantService'
import { NodeAnalysisService } from './services/NodeAnalysisService'
import { WorkflowAnalysisService } from './services/WorkflowAnalysisService'

// 导入路由
import mcpRoutes from './routes/mcp'
import recommendationRoutes from './routes/recommendations'
import analysisRoutes from './routes/analysis'
import libraryRoutes from './routes/library'
import aiRoutes from './routes/ai'

// 导入中间件和工具
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
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

// 初始化Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

// 初始化MCP服务
const n8nMCPServer = new N8NMCPServer()
const workflowLibraryService = new WorkflowLibraryService(redis)
const smartRecommenderService = new SmartRecommenderService(redis)
const aiAssistantService = new AIAssistantService()
const nodeAnalysisService = new NodeAnalysisService(redis)
const workflowAnalysisService = new WorkflowAnalysisService(redis)

// 中间件配置
app.use(helmet())
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

// 速率限制
app.use('/api', rateLimiter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      mcp: n8nMCPServer.isConnected(),
      redis: redis.status === 'ready',
      workflowLibrary: workflowLibraryService.isReady(),
      aiAssistant: aiAssistantService.isReady(),
    },
  })
})

// API路由
app.use('/api/mcp', mcpRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/ai', aiRoutes)

// Socket.IO连接处理
io.on('connection', (socket) => {
  logger.info(`MCP Client connected: ${socket.id}`)

  // MCP工具调用
  socket.on('mcp-tool-call', async (data) => {
    try {
      const { toolName, parameters } = data
      const result = await n8nMCPServer.callTool(toolName, parameters)
      socket.emit('mcp-tool-result', { success: true, result })
    } catch (error) {
      logger.error('MCP tool call error:', error)
      socket.emit('mcp-tool-result', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // 节点推荐请求
  socket.on('recommend-nodes', async (data) => {
    try {
      const { requirement, context, currentNodes } = data
      const recommendations = await smartRecommenderService.recommendNodes(
        requirement,
        context,
        currentNodes
      )
      socket.emit('node-recommendations', { success: true, recommendations })
    } catch (error) {
      logger.error('Node recommendation error:', error)
      socket.emit('node-recommendations', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // 工作流分析请求
  socket.on('analyze-workflow', async (data) => {
    try {
      const { workflow } = data
      const analysis = await workflowAnalysisService.analyzeWorkflow(workflow)
      socket.emit('workflow-analysis', { success: true, analysis })
    } catch (error) {
      logger.error('Workflow analysis error:', error)
      socket.emit('workflow-analysis', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // AI助手对话
  socket.on('ai-chat', async (data) => {
    try {
      const { message, context, conversationId } = data
      const response = await aiAssistantService.chat(message, context, conversationId)
      socket.emit('ai-response', { success: true, response })
    } catch (error) {
      logger.error('AI chat error:', error)
      socket.emit('ai-response', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // 工作流模板搜索
  socket.on('search-templates', async (data) => {
    try {
      const { query, filters } = data
      const templates = await workflowLibraryService.searchTemplates(query, filters)
      socket.emit('template-results', { success: true, templates })
    } catch (error) {
      logger.error('Template search error:', error)
      socket.emit('template-results', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // 实时节点分析
  socket.on('analyze-node', async (data) => {
    try {
      const { nodeType, parameters, context } = data
      const analysis = await nodeAnalysisService.analyzeNode(nodeType, parameters, context)
      socket.emit('node-analysis', { success: true, analysis })
    } catch (error) {
      logger.error('Node analysis error:', error)
      socket.emit('node-analysis', { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  })

  // 断开连接
  socket.on('disconnect', () => {
    logger.info(`MCP Client disconnected: ${socket.id}`)
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
const PORT = process.env.MCP_PORT || 9000

async function startServer() {
  try {
    // 测试Redis连接
    await redis.ping()
    logger.info('Connected to Redis')

    // 初始化N8N MCP服务器
    await n8nMCPServer.initialize()
    logger.info('N8N MCP Server initialized')

    // 初始化工作流库服务
    await workflowLibraryService.initialize()
    logger.info('Workflow Library Service initialized')

    // 初始化智能推荐服务
    await smartRecommenderService.initialize()
    logger.info('Smart Recommender Service initialized')

    // 初始化AI助手服务
    await aiAssistantService.initialize()
    logger.info('AI Assistant Service initialized')

    // 初始化节点分析服务
    await nodeAnalysisService.initialize()
    logger.info('Node Analysis Service initialized')

    // 初始化工作流分析服务
    await workflowAnalysisService.initialize()
    logger.info('Workflow Analysis Service initialized')

    // 启动服务器
    server.listen(PORT, () => {
      logger.info(`MCP Integration Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV}`)
      logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`)
    })
  } catch (error) {
    logger.error('Failed to start MCP server:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  server.close(() => {
    logger.info('HTTP server closed')
  })

  await n8nMCPServer.disconnect()
  logger.info('N8N MCP Server disconnected')

  redis.disconnect()
  logger.info('Redis connection closed')

  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  
  server.close(() => {
    logger.info('HTTP server closed')
  })

  await n8nMCPServer.disconnect()
  logger.info('N8N MCP Server disconnected')

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

export { app, io, redis }
