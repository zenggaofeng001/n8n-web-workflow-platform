// N8N工作流类型定义
export interface N8NWorkflow {
  id: string
  name: string
  description?: string
  active: boolean
  nodes: N8NNode[]
  connections: N8NConnections
  settings?: WorkflowSettings
  staticData?: Record<string, any>
  tags?: string[]
  createdAt: string
  updatedAt: string
  version: number
  author?: string
  category?: string
}

export interface N8NNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, any>
  credentials?: Record<string, string>
  webhookId?: string
  disabled?: boolean
  notes?: string
  color?: string
  continueOnFail?: boolean
  alwaysOutputData?: boolean
  executeOnce?: boolean
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTries?: number
}

export interface N8NConnections {
  [key: string]: {
    [key: string]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}

export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1'
  saveManualExecutions?: boolean
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any'
  callerIds?: string
  errorWorkflow?: string
  timezone?: string
  saveExecutionProgress?: boolean
  saveDataErrorExecution?: 'all' | 'none'
  saveDataSuccessExecution?: 'all' | 'none'
}

// 节点类型定义
export interface NodeType {
  name: string
  displayName: string
  description: string
  version: number
  defaults: Record<string, any>
  inputs: string[]
  outputs: string[]
  properties: NodeProperty[]
  credentials?: CredentialType[]
  webhooks?: WebhookDescription[]
  polling?: boolean
  group: NodeGroup[]
  subtitle?: string
  icon?: string
  iconUrl?: string
  codex?: {
    categories: string[]
    subcategories: Record<string, string[]>
    resources: {
      primaryDocumentation: Array<{
        url: string
      }>
      credentialDocumentation: Array<{
        url: string
      }>
    }
    alias: string[]
  }
}

export interface NodeProperty {
  displayName: string
  name: string
  type: PropertyType
  required?: boolean
  default?: any
  description?: string
  options?: Array<{
    name: string
    value: string | number | boolean
    description?: string
  }>
  placeholder?: string
  hint?: string
  displayOptions?: {
    show?: Record<string, any[]>
    hide?: Record<string, any[]>
  }
  typeOptions?: {
    minValue?: number
    maxValue?: number
    numberStepSize?: number
    loadOptionsMethod?: string
    multipleValues?: boolean
    multipleValueButtonText?: string
  }
}

export type PropertyType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'collection' 
  | 'fixedCollection' 
  | 'options' 
  | 'multiOptions' 
  | 'dateTime' 
  | 'color' 
  | 'json' 
  | 'notice' 
  | 'hidden'

export type NodeGroup = 
  | 'input' 
  | 'output' 
  | 'transform' 
  | 'trigger'

export interface CredentialType {
  name: string
  required?: boolean
  displayOptions?: {
    show?: Record<string, any[]>
    hide?: Record<string, any[]>
  }
}

export interface WebhookDescription {
  name: string
  httpMethod: string
  responseMode?: string
  path: string
  responseBinaryPropertyName?: string
}

// 工作流执行相关类型
export interface WorkflowExecution {
  id: string
  workflowId: string
  mode: 'manual' | 'trigger' | 'webhook' | 'retry'
  startedAt: string
  stoppedAt?: string
  finished: boolean
  retryOf?: string
  retrySuccessId?: string
  status: 'new' | 'running' | 'success' | 'failed' | 'canceled' | 'crashed' | 'waiting'
  data?: {
    resultData: {
      runData: Record<string, any[]>
      pinData?: Record<string, any[]>
    }
    executionData?: {
      contextData: Record<string, any>
      nodeExecutionStack: any[]
      metadata: Record<string, any>
      waitingExecution: Record<string, any>
      waitingExecutionSource: Record<string, any>
    }
  }
}

// 工作流模板类型
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  workflow: N8NWorkflow
  image?: string
  featured?: boolean
  totalViews?: number
  createdAt: string
  updatedAt: string
  author: {
    name: string
    avatar?: string
  }
  nodes: {
    count: number
    types: string[]
  }
}

// 节点推荐类型
export interface NodeRecommendation {
  node: NodeType
  score: number
  reason: string
  category: 'exact_match' | 'similar' | 'complementary' | 'popular'
  usageExamples?: string[]
}

// 工作流分析类型
export interface WorkflowAnalysis {
  complexity: 'simple' | 'medium' | 'complex'
  nodeCount: number
  connectionCount: number
  estimatedExecutionTime: number
  potentialIssues: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    nodeId?: string
    suggestion?: string
  }>
  optimizationSuggestions: Array<{
    type: 'performance' | 'reliability' | 'maintainability'
    message: string
    impact: 'low' | 'medium' | 'high'
  }>
}

// 工作流版本控制类型
export interface WorkflowVersion {
  id: string
  workflowId: string
  version: number
  name: string
  description?: string
  workflow: N8NWorkflow
  createdAt: string
  createdBy: string
  tags: string[]
  changelog?: string
}

// 用户协作类型
export interface WorkflowCollaborator {
  userId: string
  username: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  permissions: string[]
  addedAt: string
  addedBy: string
}

export interface WorkflowComment {
  id: string
  workflowId: string
  userId: string
  username: string
  content: string
  nodeId?: string
  position?: { x: number; y: number }
  createdAt: string
  updatedAt?: string
  replies?: WorkflowComment[]
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// 搜索和过滤类型
export interface WorkflowSearchParams {
  query?: string
  category?: string
  tags?: string[]
  author?: string
  dateRange?: {
    start: string
    end: string
  }
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface NodeSearchParams {
  query?: string
  group?: NodeGroup[]
  category?: string
  hasCredentials?: boolean
  hasWebhooks?: boolean
  sortBy?: 'name' | 'popularity' | 'recent'
  sortOrder?: 'asc' | 'desc'
}
