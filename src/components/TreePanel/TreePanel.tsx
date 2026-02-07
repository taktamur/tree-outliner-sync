/**
 * ツリー可視化パネルコンポーネント
 *
 * React Flowを使用してツリー構造を視覚的に表示する。
 * ノードのクリック選択とドラッグ&ドロップによる親子関係の変更が可能。
 */
import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTreeStore } from '../../store/treeStore';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import CustomNode from './CustomNode';
import './TreePanel.css';

/** カスタムノードタイプの登録 */
const nodeTypes = { custom: CustomNode };

/** ドラッグ中の状態を管理する型 */
interface DragState {
  draggedNodeId: string;
  hoverTargetId: string | null; // null = ルートにする
}

/**
 * ツリー可視化パネル
 *
 * React Flowでツリーをレンダリングし、D&D操作を可能にする。
 */
const TreePanel = () => {
  const { setSelectedNodeId, move } = useTreeStore();
  const layout = useTreeLayout();
  const [dragState, setDragState] = useState<DragState | null>(null);

  // React Flow用のノードとエッジの状態管理
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // レイアウトが変わったらReact Flowのノード・エッジを同期
  useMemo(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout.nodes, layout.edges, setFlowNodes, setFlowEdges]);

  /**
   * ドラッグ中のプレビューエッジを計算
   * 元のエッジからドラッグ中のノードに関連するものを除外し、プレビューエッジを追加
   */
  const displayEdges = useMemo((): Edge[] => {
    if (!dragState) return layout.edges;

    // ドラッグ中のノードに関連するエッジを除外
    const filteredEdges = layout.edges.filter(
      (e) => e.source !== dragState.draggedNodeId && e.target !== dragState.draggedNodeId,
    );

    // プレビューエッジを追加（hover先がある場合のみ）
    if (dragState.hoverTargetId) {
      const previewEdge: Edge = {
        id: `preview-${dragState.hoverTargetId}-${dragState.draggedNodeId}`,
        source: dragState.hoverTargetId,
        target: dragState.draggedNodeId,
        type: 'smoothstep',
        style: {
          stroke: '#22c55e', // 緑色でプレビューを示す
          strokeWidth: 2,
          strokeDasharray: '5,5', // 破線
        },
        animated: true, // アニメーション効果
      };
      return [...filteredEdges, previewEdge];
    }

    // hover先がnull（ルート化）の場合は単に元のエッジを除外するだけ
    return filteredEdges;
  }, [layout.edges, dragState]);

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
   * ドラッグ中のノード位置から最近接ノードを計算する共通関数
   */
  const findClosestNode = useCallback(
    (draggedNode: Node): { closestNode: Node | null; closestDist: number } => {
      const draggedCenter = {
        x: draggedNode.position.x + 75, // NODE_WIDTH / 2
        y: draggedNode.position.y + 20, // NODE_HEIGHT / 2
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

      return { closestNode, closestDist };
    },
    [layout.nodes],
  );

  /**
   * ノードドラッグ中の処理（リアルタイムプレビュー用）
   *
   * ドラッグ中に最近接ノードを計算し、プレビュー状態を更新する。
   */
  const onNodeDrag: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      const { closestNode, closestDist } = findClosestNode(draggedNode);

      // 120px以内にノードがあればその子にする予定、なければルート化予定
      const hoverTargetId = closestNode && closestDist < 120 ? closestNode.id : null;

      setDragState({
        draggedNodeId: draggedNode.id,
        hoverTargetId,
      });
    },
    [findClosestNode],
  );

  /**
   * ノードドラッグ終了時の処理
   *
   * ドロップ位置から最近接ノードを探し、120px以内であればその子に、
   * それ以外の場合はルートノードに移動する。
   */
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // プレビュー状態をクリア
      setDragState(null);

      // 最近接ノードを計算
      const { closestNode, closestDist } = findClosestNode(draggedNode);

      // 120px以内にノードがあればその子にする、なければルートに
      if (closestNode && closestDist < 120) {
        move(draggedNode.id, closestNode.id);
      } else {
        move(draggedNode.id, null); // 空白にドロップ → ルート化
      }
    },
    [findClosestNode, move],
  );

  return (
    <div className="tree-panel">
      <div className="tree-header">Tree Visualization</div>
      <div className="tree-content">
        <ReactFlow
          nodes={flowNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDrag={onNodeDrag}
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
