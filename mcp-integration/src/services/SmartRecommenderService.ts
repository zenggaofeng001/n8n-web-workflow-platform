import Redis from 'ioredis'
import Fuse from 'fuse.js'
import natural from 'natural'
import { similarity } from 'similarity'
import { logger } from '../utils/logger'

interface NodeType {
  name: string
  displayName: string
  description: string
  version: number
  group: string[]
  properties: any[]
  credentials?: any[]
  webhooks?: any[]
  codex?: {
    categories: string[]
    subcategories: Record<string, string[]>
    alias: string[]
  }
}

interface NodeRecommendation {
  node: NodeType
  score: number
  reason: string
  category: 'exact_match' | 'similar' | 'complementary' | 'popular'
  usageExamples?: string[]
}

interface RecommendationContext {
  currentNodes?: string[]
  workflowType?: string
  industry?: string
  useCase?: string
  complexity?: 'simple' | 'medium' | 'complex'
}

export class SmartRecommenderService {
  private redis: Redis
  private nodeTypes: NodeType[] = []
  private fuseSearch: Fuse<NodeType> | null = null
  private stemmer = natural.PorterStemmer
  private tokenizer = new natural.WordTokenizer()
  private tfidf = new natural.TfIdf()
  private isInitialized = false

  // 节点使用统计缓存
  private nodeUsageStats: Map<string, number> = new Map()
  private nodeComboStats: Map<string, number> = new Map()
  private workflowPatterns: Map<string, string[]> = new Map()

  constructor(redis: Redis) {
    this.redis = redis
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Smart Recommender Service...')

      // 加载节点类型数据
      await this.loadNodeTypes()

      // 初始化搜索引擎
      this.initializeFuseSearch()

      // 加载使用统计数据
      await this.loadUsageStats()

      // 构建TF-IDF模型
      await this.buildTfIdfModel()

      // 加载工作流模式
      await this.loadWorkflowPatterns()

      this.isInitialized = true
      logger.info('Smart Recommender Service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Smart Recommender Service:', error)
      throw error
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }

  // 主要推荐方法
  async recommendNodes(
    requirement: string,
    context: RecommendationContext = {},
    limit: number = 10
  ): Promise<NodeRecommendation[]> {
    if (!this.isInitialized) {
      throw new Error('Smart Recommender Service not initialized')
    }

    try {
      const recommendations: NodeRecommendation[] = []

      // 1. 精确匹配推荐
      const exactMatches = await this.getExactMatches(requirement)
      recommendations.push(...exactMatches)

      // 2. 语义相似性推荐
      const similarNodes = await this.getSimilarNodes(requirement, context)
      recommendations.push(...similarNodes)

      // 3. 互补节点推荐
      const complementaryNodes = await this.getComplementaryNodes(context.currentNodes || [])
      recommendations.push(...complementaryNodes)

      // 4. 流行节点推荐
      const popularNodes = await this.getPopularNodes(context)
      recommendations.push(...popularNodes)

      // 5. 基于工作流模式的推荐
      const patternNodes = await this.getPatternBasedNodes(context)
      recommendations.push(...patternNodes)

      // 去重并排序
      const uniqueRecommendations = this.deduplicateAndRank(recommendations)

      // 限制返回数量
      return uniqueRecommendations.slice(0, limit)
    } catch (error) {
      logger.error('Error in recommendNodes:', error)
      throw error
    }
  }

  // 精确匹配推荐
  private async getExactMatches(requirement: string): Promise<NodeRecommendation[]> {
    const recommendations: NodeRecommendation[] = []
    const normalizedRequirement = requirement.toLowerCase()

    for (const nodeType of this.nodeTypes) {
      // 检查节点名称匹配
      if (nodeType.name.toLowerCase().includes(normalizedRequirement) ||
          nodeType.displayName.toLowerCase().includes(normalizedRequirement)) {
        recommendations.push({
          node: nodeType,
          score: 1.0,
          reason: `Exact match for "${requirement}"`,
          category: 'exact_match',
          usageExamples: await this.getUsageExamples(nodeType.name),
        })
      }

      // 检查别名匹配
      if (nodeType.codex?.alias) {
        for (const alias of nodeType.codex.alias) {
          if (alias.toLowerCase().includes(normalizedRequirement)) {
            recommendations.push({
              node: nodeType,
              score: 0.9,
              reason: `Matches alias "${alias}"`,
              category: 'exact_match',
              usageExamples: await this.getUsageExamples(nodeType.name),
            })
          }
        }
      }
    }

    return recommendations
  }

  // 语义相似性推荐
  private async getSimilarNodes(
    requirement: string,
    context: RecommendationContext
  ): Promise<NodeRecommendation[]> {
    const recommendations: NodeRecommendation[] = []

    if (!this.fuseSearch) {
      return recommendations
    }

    // 使用Fuse.js进行模糊搜索
    const fuseResults = this.fuseSearch.search(requirement, { limit: 20 })

    for (const result of fuseResults) {
      const nodeType = result.item
      const score = 1 - result.score! // Fuse.js score is distance, we want similarity

      // 计算语义相似度
      const semanticScore = this.calculateSemanticSimilarity(requirement, nodeType)
      const finalScore = (score + semanticScore) / 2

      if (finalScore > 0.3) { // 阈值过滤
        recommendations.push({
          node: nodeType,
          score: finalScore,
          reason: `Similar functionality to "${requirement}"`,
          category: 'similar',
          usageExamples: await this.getUsageExamples(nodeType.name),
        })
      }
    }

    return recommendations
  }

  // 互补节点推荐
  private async getComplementaryNodes(currentNodes: string[]): Promise<NodeRecommendation[]> {
    const recommendations: NodeRecommendation[] = []

    if (currentNodes.length === 0) {
      return recommendations
    }

    // 基于节点组合统计推荐
    for (const currentNode of currentNodes) {
      const complementaryNodeNames = await this.getComplementaryNodeNames(currentNode)
      
      for (const nodeName of complementaryNodeNames) {
        const nodeType = this.nodeTypes.find(nt => nt.name === nodeName)
        if (nodeType && !currentNodes.includes(nodeName)) {
          const comboScore = this.nodeComboStats.get(`${currentNode}+${nodeName}`) || 0
          const normalizedScore = Math.min(comboScore / 100, 1.0) // 归一化

          recommendations.push({
            node: nodeType,
            score: normalizedScore,
            reason: `Often used together with ${currentNode}`,
            category: 'complementary',
            usageExamples: await this.getUsageExamples(nodeType.name),
          })
        }
      }
    }

    return recommendations
  }

  // 流行节点推荐
  private async getPopularNodes(context: RecommendationContext): Promise<NodeRecommendation[]> {
    const recommendations: NodeRecommendation[] = []

    // 获取使用频率最高的节点
    const sortedNodes = Array.from(this.nodeUsageStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)

    for (const [nodeName, usage] of sortedNodes) {
      const nodeType = this.nodeTypes.find(nt => nt.name === nodeName)
      if (nodeType) {
        const normalizedScore = Math.min(usage / 1000, 1.0) // 归一化

        // 根据上下文调整分数
        let contextScore = normalizedScore
        if (context.workflowType && this.matchesWorkflowType(nodeType, context.workflowType)) {
          contextScore *= 1.2
        }
        if (context.complexity && this.matchesComplexity(nodeType, context.complexity)) {
          contextScore *= 1.1
        }

        recommendations.push({
          node: nodeType,
          score: Math.min(contextScore, 1.0),
          reason: `Popular choice (used ${usage} times)`,
          category: 'popular',
          usageExamples: await this.getUsageExamples(nodeType.name),
        })
      }
    }

    return recommendations
  }

  // 基于工作流模式的推荐
  private async getPatternBasedNodes(context: RecommendationContext): Promise<NodeRecommendation[]> {
    const recommendations: NodeRecommendation[] = []

    if (!context.workflowType && !context.useCase) {
      return recommendations
    }

    const patternKey = context.workflowType || context.useCase || 'general'
    const patternNodes = this.workflowPatterns.get(patternKey) || []

    for (const nodeName of patternNodes) {
      const nodeType = this.nodeTypes.find(nt => nt.name === nodeName)
      if (nodeType) {
        recommendations.push({
          node: nodeType,
          score: 0.7,
          reason: `Common in ${patternKey} workflows`,
          category: 'complementary',
          usageExamples: await this.getUsageExamples(nodeType.name),
        })
      }
    }

    return recommendations
  }

  // 计算语义相似度
  private calculateSemanticSimilarity(requirement: string, nodeType: NodeType): number {
    const requirementTokens = this.tokenizer.tokenize(requirement.toLowerCase()) || []
    const nodeTokens = this.tokenizer.tokenize(
      `${nodeType.displayName} ${nodeType.description}`.toLowerCase()
    ) || []

    // 词干提取
    const requirementStems = requirementTokens.map(token => this.stemmer.stem(token))
    const nodeStems = nodeTokens.map(token => this.stemmer.stem(token))

    // 计算Jaccard相似度
    const intersection = requirementStems.filter(stem => nodeStems.includes(stem))
    const union = [...new Set([...requirementStems, ...nodeStems])]
    
    return intersection.length / union.length
  }

  // 去重并排序
  private deduplicateAndRank(recommendations: NodeRecommendation[]): NodeRecommendation[] {
    const nodeMap = new Map<string, NodeRecommendation>()

    for (const rec of recommendations) {
      const existing = nodeMap.get(rec.node.name)
      if (!existing || rec.score > existing.score) {
        nodeMap.set(rec.node.name, rec)
      }
    }

    return Array.from(nodeMap.values())
      .sort((a, b) => b.score - a.score)
  }

  // 辅助方法
  private async loadNodeTypes(): Promise<void> {
    try {
      // 从Redis或API加载节点类型数据
      const cachedData = await this.redis.get('node_types')
      if (cachedData) {
        this.nodeTypes = JSON.parse(cachedData)
      } else {
        // 从N8N API获取节点类型
        this.nodeTypes = await this.fetchNodeTypesFromN8N()
        await this.redis.setex('node_types', 3600, JSON.stringify(this.nodeTypes))
      }
    } catch (error) {
      logger.error('Failed to load node types:', error)
      throw error
    }
  }

  private initializeFuseSearch(): void {
    const options = {
      keys: [
        { name: 'name', weight: 0.3 },
        { name: 'displayName', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'codex.categories', weight: 0.1 },
        { name: 'codex.alias', weight: 0.1 },
      ],
      threshold: 0.6,
      includeScore: true,
    }

    this.fuseSearch = new Fuse(this.nodeTypes, options)
  }

  private async loadUsageStats(): Promise<void> {
    try {
      const stats = await this.redis.hgetall('node_usage_stats')
      for (const [nodeName, usage] of Object.entries(stats)) {
        this.nodeUsageStats.set(nodeName, parseInt(usage))
      }

      const comboStats = await this.redis.hgetall('node_combo_stats')
      for (const [combo, usage] of Object.entries(comboStats)) {
        this.nodeComboStats.set(combo, parseInt(usage))
      }
    } catch (error) {
      logger.error('Failed to load usage stats:', error)
    }
  }

  private async buildTfIdfModel(): Promise<void> {
    for (const nodeType of this.nodeTypes) {
      const document = `${nodeType.displayName} ${nodeType.description}`
      this.tfidf.addDocument(document)
    }
  }

  private async loadWorkflowPatterns(): Promise<void> {
    try {
      const patterns = await this.redis.hgetall('workflow_patterns')
      for (const [patternType, nodes] of Object.entries(patterns)) {
        this.workflowPatterns.set(patternType, JSON.parse(nodes))
      }
    } catch (error) {
      logger.error('Failed to load workflow patterns:', error)
    }
  }

  private async fetchNodeTypesFromN8N(): Promise<NodeType[]> {
    // 实现从N8N API获取节点类型的逻辑
    // 这里返回模拟数据
    return []
  }

  private async getUsageExamples(nodeName: string): Promise<string[]> {
    try {
      const examples = await this.redis.lrange(`usage_examples:${nodeName}`, 0, 2)
      return examples
    } catch (error) {
      return []
    }
  }

  private async getComplementaryNodeNames(nodeName: string): Promise<string[]> {
    try {
      const complementary = await this.redis.lrange(`complementary:${nodeName}`, 0, 9)
      return complementary
    } catch (error) {
      return []
    }
  }

  private matchesWorkflowType(nodeType: NodeType, workflowType: string): boolean {
    return nodeType.codex?.categories?.includes(workflowType) || false
  }

  private matchesComplexity(nodeType: NodeType, complexity: string): boolean {
    // 根据节点属性数量判断复杂度
    const propertyCount = nodeType.properties?.length || 0
    switch (complexity) {
      case 'simple':
        return propertyCount <= 3
      case 'medium':
        return propertyCount > 3 && propertyCount <= 8
      case 'complex':
        return propertyCount > 8
      default:
        return true
    }
  }
}
