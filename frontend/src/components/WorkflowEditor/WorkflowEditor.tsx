import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeTypes,
  EdgeTypes,
} from '@reactflow/core'
import { Panel } from '@reactflow/controls'
import { useWorkflowStore } from '@stores/workflowStore'
import { useNodeTypesStore } from '@stores/nodeTypesStore'
import { N8NWorkflow, N8NNode } from '@types/workflow'
import { NodeToolbar } from './NodeToolbar'
import { NodeSidebar } from './NodeSidebar'
import { WorkflowToolbar } from './WorkflowToolbar'
import { CustomNode } from './CustomNode'
import { CustomEdge } from './CustomEdge'
import { NodeContextMenu } from './NodeContextMenu'
import { WorkflowSettings } from './WorkflowSettings'
import { ExecutionPanel } from './ExecutionPanel'
import { cn } from '@utils/cn'

// 自定义节点类型
const nodeTypes: NodeTypes = {
  n8nNode: CustomNode,
}

// 自定义边类型
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

interface WorkflowEditorProps {
  workflowId?: string
  className?: string
  readOnly?: boolean
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflowId,
  className,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    nodeId?: string
  } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showExecution, setShowExecution] = useState(false)

  const {
    currentWorkflow,
    loadWorkflow,
    saveWorkflow,
    updateWorkflow,
    isLoading,
    error,
  } = useWorkflowStore()

  const { nodeTypes: availableNodeTypes, loadNodeTypes } = useNodeTypesStore()

  // 加载工作流数据
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId)
    }
    loadNodeTypes()
  }, [workflowId, loadWorkflow, loadNodeTypes])

  // 将N8N工作流转换为ReactFlow格式
  useEffect(() => {
    if (currentWorkflow) {
      const flowNodes = convertN8NNodesToFlow(currentWorkflow.nodes)
      const flowEdges = convertN8NConnectionsToFlow(currentWorkflow.connections)
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [currentWorkflow, setNodes, setEdges])

  // 转换N8N节点为ReactFlow节点
  const convertN8NNodesToFlow = (n8nNodes: N8NNode[]): Node[] => {
    return n8nNodes.map((node) => ({
      id: node.id,
      type: 'n8nNode',
      position: { x: node.position[0], y: node.position[1] },
      data: {
        ...node,
        nodeType: availableNodeTypes.find(nt => nt.name === node.type),
      },
      selected: false,
      draggable: !readOnly,
    }))
  }

  // 转换N8N连接为ReactFlow边
  const convertN8NConnectionsToFlow = (connections: any): Edge[] => {
    const flowEdges: Edge[] = []
    
    Object.entries(connections).forEach(([sourceNodeName, outputs]) => {
      Object.entries(outputs as any).forEach(([outputIndex, targets]) => {
        (targets as any[]).forEach((target, targetIndex) => {
          flowEdges.push({
            id: `${sourceNodeName}-${outputIndex}-${target.node}-${target.index}`,
            source: sourceNodeName,
            target: target.node,
            sourceHandle: `output-${outputIndex}`,
            targetHandle: `input-${target.index}`,
            type: 'custom',
            animated: false,
          })
        })
      })
    })

    return flowEdges
  }

  // 处理连接创建
  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return
      
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        type: 'custom',
        animated: false,
      }
      
      setEdges((eds) => addEdge(newEdge, eds))
      
      // 更新工作流连接数据
      if (currentWorkflow) {
        const updatedConnections = { ...currentWorkflow.connections }
        // 实现连接逻辑...
        updateWorkflow({ connections: updatedConnections })
      }
    },
    [readOnly, setEdges, currentWorkflow, updateWorkflow]
  )

  // 处理节点选择
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setContextMenu(null)
  }, [])

  // 处理右键菜单
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    })
  }, [])

  // 处理画布点击
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setContextMenu(null)
  }, [])

  // 添加新节点
  const addNode = useCallback((nodeType: string, position: { x: number; y: number }) => {
    if (readOnly) return

    const nodeTypeInfo = availableNodeTypes.find(nt => nt.name === nodeType)
    if (!nodeTypeInfo) return

    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: 'n8nNode',
      position,
      data: {
        id: `${nodeType}-${Date.now()}`,
        name: nodeTypeInfo.displayName,
        type: nodeType,
        typeVersion: nodeTypeInfo.version,
        position: [position.x, position.y],
        parameters: { ...nodeTypeInfo.defaults },
        nodeType: nodeTypeInfo,
      },
      draggable: true,
    }

    setNodes((nds) => [...nds, newNode])

    // 更新工作流数据
    if (currentWorkflow) {
      const updatedNodes = [...currentWorkflow.nodes, newNode.data as N8NNode]
      updateWorkflow({ nodes: updatedNodes })
    }
  }, [readOnly, availableNodeTypes, setNodes, currentWorkflow, updateWorkflow])

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    if (readOnly) return

    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }

    // 更新工作流数据
    if (currentWorkflow) {
      const updatedNodes = currentWorkflow.nodes.filter(node => node.id !== nodeId)
      updateWorkflow({ nodes: updatedNodes })
    }
  }, [readOnly, setNodes, setEdges, selectedNode, currentWorkflow, updateWorkflow])

  // 保存工作流
  const handleSave = useCallback(async () => {
    if (!currentWorkflow || readOnly) return
    
    try {
      await saveWorkflow(currentWorkflow)
    } catch (error) {
      console.error('Failed to save workflow:', error)
    }
  }, [currentWorkflow, saveWorkflow, readOnly])

  // 执行工作流
  const handleExecute = useCallback(() => {
    if (!currentWorkflow || readOnly) return
    setShowExecution(true)
    // 实现执行逻辑...
  }, [currentWorkflow, readOnly])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className={cn('h-full flex', className)}>
      {/* 节点侧边栏 */}
      <NodeSidebar
        onAddNode={addNode}
        availableNodeTypes={availableNodeTypes}
        className="w-80 border-r"
      />

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <WorkflowToolbar
          onSave={handleSave}
          onExecute={handleExecute}
          onSettings={() => setShowSettings(true)}
          readOnly={readOnly}
          className="border-b"
        />

        {/* ReactFlow编辑器 */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={onPaneClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              attributionPosition="bottom-left"
              className="bg-gray-50"
            >
              <Background />
              <Controls />
              <MiniMap />
              
              {/* 节点工具栏 */}
              {selectedNode && (
                <NodeToolbar
                  node={selectedNode}
                  onDelete={() => deleteNode(selectedNode.id)}
                  onDuplicate={() => {/* 实现复制逻辑 */}}
                  readOnly={readOnly}
                />
              )}
            </ReactFlow>
          </ReactFlowProvider>

          {/* 右键菜单 */}
          {contextMenu && (
            <NodeContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              nodeId={contextMenu.nodeId}
              onClose={() => setContextMenu(null)}
              onDelete={deleteNode}
              readOnly={readOnly}
            />
          )}
        </div>
      </div>

      {/* 节点属性面板 */}
      {selectedNode && (
        <div className="w-96 border-l bg-white">
          {/* 节点属性编辑器 */}
        </div>
      )}

      {/* 工作流设置对话框 */}
      {showSettings && (
        <WorkflowSettings
          workflow={currentWorkflow}
          onClose={() => setShowSettings(false)}
          onSave={(settings) => {
            updateWorkflow({ settings })
            setShowSettings(false)
          }}
        />
      )}

      {/* 执行面板 */}
      {showExecution && (
        <ExecutionPanel
          workflow={currentWorkflow}
          onClose={() => setShowExecution(false)}
        />
      )}
    </div>
  )
}
