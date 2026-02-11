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
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTreeStore } from '../store/treeStore';
import { useTreeLayout } from './useTreeLayout';
import CustomNode from './CustomNode';
import { determineDropTarget, type NodeRect, type DropTarget, type InsertMode } from './dragCalculator';
import './TreePanel.css';

/** カスタムノードタイプの登録 */
const nodeTypes = { custom: CustomNode };

/** プレビューライン表示用のコンポーネント */
const PreviewLine = ({ dragState, layoutNodes }: { dragState: DragState; layoutNodes: Node[] }) => {
  const { getViewport } = useReactFlow();

  // insertModeがない、またはtargetNodeIdがない場合は何も表示しない
  if (!dragState.insertMode || !dragState.targetNodeId) {
    return null;
  }

  // CHILDモードの場合はエッジプレビューのみなので何も表示しない
  if (dragState.insertMode === 'child') {
    return null;
  }

  // ターゲットノードを取得
  const targetNode = layoutNodes.find((n) => n.id === dragState.targetNodeId);
  if (!targetNode) {
    return null;
  }

  // ターゲットノードの幅を計算
  const targetLabel = (targetNode.data as { label?: string }).label || '...';
  const targetWidth = targetLabel.length * 8 + 32; // CHAR_WIDTH=8, HORIZONTAL_PADDING=32

  // プレビューラインのY座標を計算
  const NODE_HEIGHT = 40;
  let lineY: number;
  if (dragState.insertMode === 'before') {
    // 上側ゾーン: ノードの上端
    lineY = targetNode.position.y;
  } else {
    // 下側ゾーン: ノードの下端
    lineY = targetNode.position.y + NODE_HEIGHT;
  }

  const viewport = getViewport();

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <line
        x1={(targetNode.position.x) * viewport.zoom + viewport.x}
        y1={lineY * viewport.zoom + viewport.y}
        x2={(targetNode.position.x + targetWidth) * viewport.zoom + viewport.x}
        y2={lineY * viewport.zoom + viewport.y}
        stroke="#22c55e"
        strokeWidth={2}
        strokeDasharray="5,5"
      />
    </svg>
  );
};

/** ドラッグ中の状態を保持 */
interface DragState {
  nodeId: string | null;
  /** ドラッグ開始時の親ID（親ID比較用） */
  originalParentId: string | null | undefined;
  /** 挿入モード（プレビュー表示用） */
  insertMode?: InsertMode;
  /** ドロップターゲットのノードID（プレビュー表示用） */
  targetNodeId?: string;
}

/**
 * ツリー可視化パネル
 *
 * React Flowでツリーをレンダリングし、D&D操作を可能にする。
 */
const TreePanel = () => {
  const { setSelectedNodeId, move, moveBefore, moveAfter, moveAsFirstChild } = useTreeStore();
  const { nodes: layoutNodes, edges: layoutEdges } = useTreeLayout();

  // React Flow用のノードとエッジの状態管理
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(layoutNodes);
  const [, setFlowEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // ドラッグ中の状態を管理（プレビュー表示用）
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
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
   * 表示用のエッジを計算（ドラッグ中は旧親との接続を隠す）
   */
  const displayEdges = useMemo<Edge[]>(() => {
    if (!dragState.nodeId) {
      // ドラッグ中でなければ通常のエッジを表示
      return layoutEdges;
    }

    // ドラッグ中のノードへのエッジを除外（旧親との接続を隠す）
    return layoutEdges.filter(
      (edge) => edge.target !== dragState.nodeId,
    );
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
      const dropTarget: DropTarget = determineDropTarget(dragged, candidates, 120);

      setDragState({
        nodeId: draggedNode.id,
        originalParentId: dragState.originalParentId,
        insertMode: dropTarget.insertMode,
        targetNodeId: dropTarget.targetNodeId,
      });
    },
    [nodeToRect, layoutNodes, dragState.originalParentId],
  );

  /**
   * ノードドラッグ終了時の処理
   *
   * ドロップ位置から新しい親と挿入位置を判定し、挿入モードに応じて移動する。
   * insertModeに応じて適切な関数を呼び出す：
   * - before: moveNodeBefore（兄弟として直前に挿入）
   * - after: moveNodeAfter（兄弟として直後に挿入）
   * - child: moveNodeAsFirstChild（子の先頭に挿入）
   */
  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_event, draggedNode) => {
      // React FlowのNodeをNodeRectに変換
      const dragged = nodeToRect(draggedNode);
      const candidates = layoutNodes
        .filter((n) => n.id !== draggedNode.id)
        .map(nodeToRect);

      // determineDropTargetを使ってドロップ先を判定
      const dropTarget: DropTarget = determineDropTarget(dragged, candidates, 120);

      // insertModeがない場合（閾値超過でルート化）は、従来通りmove()を使用
      if (!dropTarget.insertMode || !dropTarget.targetNodeId) {
        const originalParentId = dragState.originalParentId ?? null;
        if (dropTarget.parentId !== originalParentId) {
          move(draggedNode.id, dropTarget.parentId, dropTarget.insertOrder);
        } else {
          setFlowNodes(layoutNodes);
        }
      } else {
        // insertModeに応じた移動処理（undo履歴を含む）
        const { nodes } = useTreeStore.getState();

        // ターゲットノードを取得してルートノードかどうか判定
        const targetNode = nodes.find((n) => n.id === dropTarget.targetNodeId);
        const isTargetRoot = targetNode?.parentId === null;

        // ルートノードの場合の特殊処理
        if (isTargetRoot) {
          if (dropTarget.insertMode === 'before') {
            // ルートノードの直前に挿入（ルート化）
            moveBefore(draggedNode.id, dropTarget.targetNodeId);
          } else if (dropTarget.insertMode === 'child' || dropTarget.insertMode === 'after') {
            // 中央ゾーンと下側ゾーンは直後に挿入（ルート化）
            moveAfter(draggedNode.id, dropTarget.targetNodeId);
          }
        } else {
          // 通常のノードの場合
          if (dropTarget.insertMode === 'before') {
            moveBefore(draggedNode.id, dropTarget.targetNodeId);
          } else if (dropTarget.insertMode === 'after') {
            moveAfter(draggedNode.id, dropTarget.targetNodeId);
          } else if (dropTarget.insertMode === 'child') {
            moveAsFirstChild(draggedNode.id, dropTarget.targetNodeId);
          }
        }
      }

      // ドラッグ状態をリセット
      setDragState({
        nodeId: null,
        originalParentId: undefined,
        insertMode: undefined,
        targetNodeId: undefined,
      });
    },
    [nodeToRect, layoutNodes, move, moveBefore, moveAfter, moveAsFirstChild, dragState.originalParentId, setFlowNodes],
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
          <PreviewLine dragState={dragState} layoutNodes={layoutNodes} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TreePanel;
