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

// カスタムノードタイプの登録
const nodeTypes = { custom: CustomNode };

/**
 * ツリー可視化パネルコンポーネント
 * React Flowを使用してツリー構造をグラフィカルに表示
 * ノードのクリック選択とドラッグ＆ドロップによる親子関係の変更をサポート
 */
const TreePanel = () => {
  const { setSelectedNodeId, move } = useTreeStore();
  const layout = useTreeLayout(); // レイアウト計算済みのノード・エッジを取得

  // React Flowの内部状態管理
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // レイアウトが変わったらflowノードを更新
  // （ストアの変更 → レイアウト再計算 → React Flow更新の流れ）
  useMemo(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout.nodes, layout.edges, setFlowNodes, setFlowEdges]);

  // ノードクリック時: 選択状態を更新
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  /**
   * ノードドラッグ終了時のハンドラ
   * 最も近いノードを検索し、120px以内なら親子関係を作成
   * それ以外の場合はルートノードに変更
   */
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // ドロップされたノードの中心座標を計算
      const draggedCenter = {
        x: draggedNode.position.x + 75, // ノード幅の半分
        y: draggedNode.position.y + 20, // ノード高さの半分
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
        move(draggedNode.id, null); // ルートノードに変更
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
