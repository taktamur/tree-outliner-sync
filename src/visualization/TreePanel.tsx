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
import { useTreeStore } from '../store/treeStore';
import { useTreeLayout } from './useTreeLayout';
import CustomNode from './CustomNode';
import { determineDropTarget, type NodeRect } from './dragCalculator';
import './TreePanel.css';

/** カスタムノードタイプの登録 */
const nodeTypes = { custom: CustomNode };

/** ドラッグ中の状態を保持 */
interface DragState {
  nodeId: string | null;
  hoverTargetId: string | null;
  /** ドラッグ開始時の親ID（案2: 親ID比較用） */
  originalParentId: string | null | undefined;
}

/**
 * ツリー可視化パネル
 *
 * React Flowでツリーをレンダリングし、D&D操作を可能にする。
 */
const TreePanel = () => {
  const { setSelectedNodeId, move } = useTreeStore();
  const { nodes: layoutNodes, edges: layoutEdges } = useTreeLayout();

  // React Flow用のノードとエッジの状態管理
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layoutNodes);
  const [, setFlowEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // ドラッグ中の状態を管理（プレビュー表示用）
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    hoverTargetId: null,
    originalParentId: undefined,
  });

  // レイアウトが変わったらReact Flowのノード・エッジを同期
  useMemo(() => {
    setFlowNodes(layoutNodes);
    setFlowEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setFlowNodes, setFlowEdges]);

  /**
   * React FlowのNodeをNodeRectに変換するヘルパー
   */
  const nodeToRect = useCallback((node: Node): NodeRect => {
    const label = (node.data as { label?: string }).label || '...';
    return {
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      label,
    };
  }, []);

  /**
   * 表示用のエッジを計算（ドラッグ中はプレビュー表示）
   */
  const displayEdges = useMemo<Edge[]>(() => {
    if (!dragState.nodeId) {
      // ドラッグ中でなければ通常のエッジを表示
      return layoutEdges;
    }

    // ドラッグ中のノードへのエッジを除外（旧親との接続を隠す）
    const filteredEdges = layoutEdges.filter(
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
  }, [layoutEdges, dragState]);

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
   * ノードドラッグ開始時の処理
   *
   * ドラッグ開始時の親IDを記録する。
   * これにより、ドロップ時に親が実際に変わったかどうかを判定できる。
   */
  const onNodeDragStart: NodeMouseHandler = useCallback(
    (_event, node) => {
      // ストアから現在の親IDを取得
      const { nodes } = useTreeStore.getState();
      const treeNode = nodes.find((n) => n.id === node.id);
      const originalParentId = treeNode?.parentId ?? null;

      setDragState({
        nodeId: node.id,
        hoverTargetId: null,
        originalParentId,
      });
    },
    [],
  );

  /**
   * ノードドラッグ中の処理（リアルタイムプレビュー）
   *
   * ドラッグ中の位置から最近接ノードを探し、120px以内であれば
   * プレビューエッジを表示する。
   */
  const onNodeDrag: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // React FlowのNodeをNodeRectに変換
      const dragged = nodeToRect(draggedNode);
      const candidates = layoutNodes
        .filter((n) => n.id !== draggedNode.id)
        .map(nodeToRect);

      // determineDropTargetを使ってドロップ先を判定
      const hoverTargetId = determineDropTarget(dragged, candidates, 120);

      setDragState({
        nodeId: draggedNode.id,
        hoverTargetId,
        originalParentId: dragState.originalParentId,
      });
    },
    [nodeToRect, layoutNodes, dragState.originalParentId],
  );

  /**
   * ノードドラッグ終了時の処理（案2: 親ID比較方式）
   *
   * ドロップ位置から新しい親を判定し、ドラッグ開始時の親と異なる場合のみ移動する。
   * これにより、「レイアウト調整のためのドラッグ」と「親子関係変更のためのドラッグ」を区別できる。
   */
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // React FlowのNodeをNodeRectに変換
      const dragged = nodeToRect(draggedNode);
      const candidates = layoutNodes
        .filter((n) => n.id !== draggedNode.id)
        .map(nodeToRect);

      // determineDropTargetを使ってドロップ先を判定
      const newParentId = determineDropTarget(dragged, candidates, 120);

      // ドラッグ開始時の親IDと比較（undefined チェック）
      const originalParentId = dragState.originalParentId ?? null;

      // 親が実際に変わった場合のみ move() を実行
      if (newParentId !== originalParentId) {
        move(draggedNode.id, newParentId);
      }

      // ドラッグ状態をリセット
      setDragState({ nodeId: null, hoverTargetId: null, originalParentId: undefined });
    },
    [nodeToRect, layoutNodes, move, dragState.originalParentId],
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
          onNodeDragStart={onNodeDragStart}
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
