import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTreeStore } from '../../store/treeStore';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import CustomNode from './CustomNode';
import './TreePanel.css';

const nodeTypes = { custom: CustomNode };

const TreePanel = () => {
  const { setSelectedNodeId, move } = useTreeStore();
  const layout = useTreeLayout();

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // レイアウトが変わったらflowノードを更新
  useMemo(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout.nodes, layout.edges, setFlowNodes, setFlowEdges]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // ドロップされたノードの位置から、最も近い他のノードを探す
      const draggedCenter = {
        x: draggedNode.position.x + 75,
        y: draggedNode.position.y + 20,
      };

      let closestNode: Node | null = null;
      let closestDist = Infinity;

      for (const n of layout.nodes) {
        if (n.id === draggedNode.id) continue;
        const nodeCenter = { x: n.position.x + 75, y: n.position.y + 20 };
        const dist = Math.sqrt(
          (draggedCenter.x - nodeCenter.x) ** 2 + (draggedCenter.y - nodeCenter.y) ** 2,
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestNode = n;
        }
      }

      // 120px以内にノードがあればその子にする、なければルートに
      if (closestNode && closestDist < 120) {
        move(draggedNode.id, closestNode.id);
      } else {
        move(draggedNode.id, null);
      }
    },
    [layout.nodes, move],
  );

  return (
    <div className="tree-panel">
      <div className="tree-header">Tree Visualization</div>
      <div className="tree-content">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TreePanel;
