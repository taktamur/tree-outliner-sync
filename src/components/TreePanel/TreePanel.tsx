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
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTreeStore } from '../../store/treeStore';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import CustomNode from './CustomNode';
import './TreePanel.css';

/** カスタムノードタイプの登録 */
const nodeTypes = { custom: CustomNode };

/** ドラッグ中の状態を保持 */
interface DragState {
  nodeId: string | null;
  hoverTargetId: string | null;
}

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
  const [, setFlowEdges, onEdgesChange] = useEdgesState(layout.edges);

  // ドラッグ中の状態を管理（プレビュー表示用）
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    hoverTargetId: null,
  });

  // レイアウトが変わったらReact Flowのノード・エッジを同期
  useMemo(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [layout.nodes, layout.edges, setFlowNodes, setFlowEdges]);

  /**
   * 最近接ノードを探す共通ロジック
   */
  const findClosestNode = useCallback(
    (draggedNode: Node): { node: Node | null; distance: number } => {
      const draggedCenter = {
        x: draggedNode.position.x + 75, // NODE_WIDTH / 2
        y: draggedNode.position.y + 20, // NODE_HEIGHT / 2
      };

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

      return { node: closestNode, distance: closestDist };
    },
    [layout.nodes],
  );

  /**
   * 表示用のエッジを計算（ドラッグ中はプレビュー表示）
   */
  const displayEdges = useMemo<Edge[]>(() => {
    if (!dragState.nodeId) {
      // ドラッグ中でなければ通常のエッジを表示
      return layout.edges;
    }

    // ドラッグ中のノードへのエッジを除外（旧親との接続を隠す）
    const filteredEdges = layout.edges.filter(
      (edge) => edge.target !== dragState.nodeId,
    );

    // プレビューエッジを追加（hoverTargetIdがある場合のみ）
    if (dragState.hoverTargetId) {
      const previewEdge: Edge = {
        id: `preview-${dragState.nodeId}-${dragState.hoverTargetId}`,
        source: dragState.hoverTargetId,
        target: dragState.nodeId,
        style: { stroke: '#22c55e', strokeWidth: 2 },
        animated: true,
        type: 'smoothstep',
        // @ts-expect-error strokeDasharray is not in Edge type but works
        strokeDasharray: '5,5',
      };
      return [...filteredEdges, previewEdge];
    }

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
   * ノードドラッグ中の処理（リアルタイムプレビュー）
   *
   * ドラッグ中の位置から最近接ノードを探し、120px以内であれば
   * プレビューエッジを表示する。
   */
  const onNodeDrag: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      const { node: closestNode, distance: closestDist } =
        findClosestNode(draggedNode);

      // 120px以内にノードがあればプレビュー、なければnull（ルート化）
      const hoverTargetId =
        closestNode && closestDist < 120 ? closestNode.id : null;

      setDragState({
        nodeId: draggedNode.id,
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
      const { node: closestNode, distance: closestDist } =
        findClosestNode(draggedNode);

      // 120px以内にノードがあればその子にする、なければルートに
      if (closestNode && closestDist < 120) {
        move(draggedNode.id, closestNode.id);
      } else {
        move(draggedNode.id, null); // 空白にドロップ → ルート化
      }

      // ドラッグ状態をリセット
      setDragState({ nodeId: null, hoverTargetId: null });
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
