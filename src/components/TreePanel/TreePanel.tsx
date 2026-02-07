/**
 * ツリー可視化パネルコンポーネント
 *
 * React Flowを使用してツリー構造を視覚的に表示する。
 * ノードのクリック選択とドラッグ&ドロップによる親子関係の変更が可能。
 */
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

/** カスタムノードタイプの登録 */
const nodeTypes = { custom: CustomNode };

/**
 * ツリー可視化パネル
 *
 * React Flowでツリーをレンダリングし、D&D操作を可能にする。
 */
const TreePanel = () => {
  const { setSelectedNodeId, move } = useTreeStore();
  const layout = useTreeLayout();

  // React Flow用のノードとエッジの状態管理
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // レイアウトが変わったらReact Flowのノード・エッジを同期
  useMemo(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout.nodes, layout.edges, setFlowNodes, setFlowEdges]);

  /**
   * ノードクリック時の処理
   * クリックされたノードを選択状態にする
   */
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  /**
   * ノードドラッグ終了時の処理
   *
   * ドロップ位置から最近接ノードを探し、120px以内であればその子に、
   * それ以外の場合はルートノードに移動する。
   */
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // ドラッグされたノードの中心座標を計算
      const draggedCenter = {
        x: draggedNode.position.x + 75, // NODE_WIDTH / 2
        y: draggedNode.position.y + 20, // NODE_HEIGHT / 2
      };

      // 最も近いノードを探索
      let closestNode: Node | null = null;
      let closestDist = Infinity;

      for (const n of layout.nodes) {
        if (n.id === draggedNode.id) continue; // 自分自身は除外
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
        move(draggedNode.id, null); // 空白にドロップ → ルート化
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
