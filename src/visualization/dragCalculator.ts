/**
 * ドラッグ&ドロップ時のノード選択ロジック
 *
 * TreePanel.tsxから分離した純粋関数群。
 * テスト可能な形で最近接ノード検索とドロップ先判定を提供する。
 */
import { calculateNodeWidth, NODE_HEIGHT } from './layoutCalculator';

/** ノードの矩形情報（React Flowのノードから抽出） */
export interface NodeRect {
  id: string;
  x: number;      // position.x
  y: number;      // position.y
  label: string;  // data.label
}

/** 最近接ノード検索の結果 */
export interface ClosestNodeResult {
  nodeId: string | null;
  distance: number;
}

/** 挿入モード */
export type InsertMode = 'before' | 'child' | 'after';

/** ドロップ先の情報 */
export interface DropTarget {
  /** ドロップ先の親ノードID（nullの場合はルート化） */
  parentId: string | null;
  /** 挿入位置のorder値（undefinedの場合は末尾に追加） */
  insertOrder?: number;
  /** 挿入モード（プレビュー表示用） */
  insertMode?: InsertMode;
  /** ドロップターゲットのノードID（プレビュー表示用） */
  targetNodeId?: string;
}

/**
 * 最近接ノードを検索
 *
 * ドラッグされたノードから最も近いノードを探す。
 * 各ノードの中心座標を計算し、ユークリッド距離で判定する。
 *
 * @param dragged ドラッグされたノード
 * @param candidates 候補ノード（自分自身は含めない前提）
 * @returns 最近接ノードのIDと距離（候補がない場合はnull）
 */
export const findClosestNode = (
  dragged: NodeRect,
  candidates: NodeRect[],
): ClosestNodeResult => {
  if (candidates.length === 0) {
    return { nodeId: null, distance: Infinity };
  }

  // ドラッグされたノードの中心座標を計算
  const draggedWidth = calculateNodeWidth(dragged.label);
  const draggedCenter = {
    x: dragged.x + draggedWidth / 2,
    y: dragged.y + NODE_HEIGHT / 2,
  };

  let closestNodeId: string | null = null;
  let closestDistance = Infinity;

  // 各候補ノードとの距離を計算
  for (const candidate of candidates) {
    const candidateWidth = calculateNodeWidth(candidate.label);
    const candidateCenter = {
      x: candidate.x + candidateWidth / 2,
      y: candidate.y + NODE_HEIGHT / 2,
    };

    const distance = Math.sqrt(
      (draggedCenter.x - candidateCenter.x) ** 2 +
      (draggedCenter.y - candidateCenter.y) ** 2,
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestNodeId = candidate.id;
    }
  }

  return { nodeId: closestNodeId, distance: closestDistance };
};

/**
 * ドロップゾーンを判定（ノードを縦3分割）
 *
 * ドラッグされたノードのY座標から、ターゲットノードのどのゾーンにドロップするかを判定する。
 * - 上側ゾーン（上1/3）: 兄弟として直前に挿入
 * - 中央ゾーン（中央1/3）: 子ノードとして先頭に挿入
 * - 下側ゾーン（下1/3）: 兄弟として直後に挿入
 *
 * @param draggedCenterY ドラッグされたノードの中心Y座標
 * @param targetNode ターゲットノード
 * @returns 挿入モード
 */
export const determineInsertMode = (
  draggedCenterY: number,
  targetNode: NodeRect,
): InsertMode => {
  const upperBound = targetNode.y + NODE_HEIGHT / 3;
  const lowerBound = targetNode.y + (NODE_HEIGHT * 2) / 3;

  if (draggedCenterY < upperBound) return 'before';
  if (draggedCenterY > lowerBound) return 'after';
  return 'child';
};

/**
 * ドロップ先を判定
 *
 * 最近接ノードを探し、閾値以内であればそのノードIDを返す。
 * 閾値を超える場合はnull（ルート化）を返す。
 *
 * @param dragged ドラッグされたノード
 * @param candidates 候補ノード（自分自身は含めない前提）
 * @param threshold 閾値（px）デフォルト120px
 * @returns ドロップ先の情報（parentIdとinsertOrder）
 */
export const determineDropTarget = (
  dragged: NodeRect,
  candidates: NodeRect[],
  threshold = 120,
): DropTarget => {
  const { nodeId, distance } = findClosestNode(dragged, candidates);

  // 閾値を超える場合はルート化（末尾に追加）
  if (nodeId === null || distance >= threshold) {
    return { parentId: null };
  }

  // 最近接ノードを取得
  const targetNode = candidates.find((c) => c.id === nodeId);
  if (!targetNode) {
    return { parentId: null };
  }

  // ドラッグされたノードの中心Y座標を計算
  const draggedCenterY = dragged.y + NODE_HEIGHT / 2;

  // ゾーン判定
  const insertMode = determineInsertMode(draggedCenterY, targetNode);

  return {
    parentId: nodeId,
    insertMode,
    targetNodeId: nodeId,
  };
};
