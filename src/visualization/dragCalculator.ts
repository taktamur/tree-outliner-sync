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
 * ドロップゾーンを判定（ノードを縦3分割、子なしノードは右側検出も行う）
 *
 * ドラッグされたノードのY座標から、ターゲットノードのどのゾーンにドロップするかを判定する。
 * - 上側ゾーン（上1/3）: 兄弟として直前に挿入
 * - 中央ゾーン（中央1/3）: 子ノードとして先頭に挿入
 * - 下側ゾーン（下1/3）: 兄弟として直後に挿入
 *
 * 子のないノードの場合、右側2/3にドロップすると中央ゾーン扱いにして子挿入を優先する。
 *
 * @param draggedCenterY ドラッグされたノードの中心Y座標
 * @param draggedCenterX ドラッグされたノードの中心X座標
 * @param targetNode ターゲットノード
 * @param hasChildren ターゲットノードが子を持つかどうか
 * @returns 挿入モード
 */
export const determineInsertMode = (
  draggedCenterY: number,
  draggedCenterX: number,
  targetNode: NodeRect,
  hasChildren: boolean,
): InsertMode => {
  // 子がないノードの右側検出
  if (!hasChildren) {
    const targetWidth = calculateNodeWidth(targetNode.label);
    const rightBound = targetNode.x + targetWidth / 3;

    // 右側2/3にドロップした場合は子挿入を優先
    if (draggedCenterX > rightBound) {
      return 'child';
    }
  }

  // 縦方向のゾーン判定
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
 * @param getHasChildren ノードIDから子の有無を判定する関数
 * @returns ドロップ先の情報（parentIdとinsertOrder）
 * @deprecated 旧アルゴリズム。新しいアルゴリズムは determineDropTargetV2 を使用してください。
 */
export const determineDropTarget = (
  dragged: NodeRect,
  candidates: NodeRect[],
  threshold = 120,
  getHasChildren?: (nodeId: string) => boolean,
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

  // ドラッグされたノードの中心座標を計算
  const draggedWidth = calculateNodeWidth(dragged.label);
  const draggedCenterX = dragged.x + draggedWidth / 2;
  const draggedCenterY = dragged.y + NODE_HEIGHT / 2;

  // ターゲットノードが子を持つかどうかを判定
  const hasChildren = getHasChildren ? getHasChildren(nodeId) : false;

  // ゾーン判定
  const insertMode = determineInsertMode(draggedCenterY, draggedCenterX, targetNode, hasChildren);

  return {
    parentId: nodeId,
    insertMode,
    targetNodeId: nodeId,
  };
};

/**
 * 左側ノード吸着方式でドロップ先を判定（V2アルゴリズム）
 *
 * 1. 候補を左側ノードと同列ノードに分類
 * 2. 同列ノード優先で|ΔY|最小を選択（同率なら|ΔX|最小）
 * 3. 左側ターゲット→child、同列ターゲット→before/after
 *
 * @param dragged ドラッグされたノード
 * @param candidates 候補ノード（自分自身は含めない前提）
 * @returns ドロップ先の情報
 */
export const determineDropTargetV2 = (
  dragged: NodeRect,
  candidates: NodeRect[],
): DropTarget => {
  if (candidates.length === 0) {
    return { parentId: null };
  }

  const draggedCenterY = dragged.y + NODE_HEIGHT / 2;
  const draggedLeft = dragged.x;

  // 候補を左側ノードと同列ノードに分類
  const leftNodes: NodeRect[] = [];
  const sameColumnNodes: NodeRect[] = [];

  for (const candidate of candidates) {
    const candidateWidth = calculateNodeWidth(candidate.label);
    const candidateRight = candidate.x + candidateWidth;

    if (candidateRight < draggedLeft) {
      // 左側ノード: 候補の右端 < ドラッグの左端
      leftNodes.push(candidate);
    } else {
      // 同列ノード: X範囲が重なる
      sameColumnNodes.push(candidate);
    }
  }

  // 同列ノード優先で|ΔY|最小を選択
  let targetNode: NodeRect | null = null;
  let minDeltaY = Infinity;
  let minDeltaX = Infinity;

  // まず同列ノードから選択
  for (const node of sameColumnNodes) {
    const candidateCenterY = node.y + NODE_HEIGHT / 2;
    const deltaY = Math.abs(draggedCenterY - candidateCenterY);

    if (deltaY < minDeltaY || (deltaY === minDeltaY && Math.abs(node.x - dragged.x) < minDeltaX)) {
      minDeltaY = deltaY;
      minDeltaX = Math.abs(node.x - dragged.x);
      targetNode = node;
    }
  }

  // 同列ノードが見つからなければ左側ノードから選択
  if (targetNode === null) {
    for (const node of leftNodes) {
      const candidateCenterY = node.y + NODE_HEIGHT / 2;
      const deltaY = Math.abs(draggedCenterY - candidateCenterY);

      if (deltaY < minDeltaY || (deltaY === minDeltaY && Math.abs(node.x - dragged.x) < minDeltaX)) {
        minDeltaY = deltaY;
        minDeltaX = Math.abs(node.x - dragged.x);
        targetNode = node;
      }
    }
  }

  // ターゲットが見つからない場合はルート化
  if (targetNode === null) {
    return { parentId: null };
  }

  // 挿入モード決定
  const isLeftTarget = leftNodes.includes(targetNode);
  const insertMode = determineInsertModeV2(draggedCenterY, targetNode, isLeftTarget);

  return {
    parentId: targetNode.id,
    insertMode,
    targetNodeId: targetNode.id,
  };
};

/**
 * 左側ノード吸着方式で挿入モードを判定（V2アルゴリズム）
 *
 * @param draggedCenterY ドラッグされたノードの中心Y座標
 * @param targetNode ターゲットノード
 * @param isLeftTarget 左側ノードかどうか
 * @returns 挿入モード
 */
export const determineInsertModeV2 = (
  draggedCenterY: number,
  targetNode: NodeRect,
  isLeftTarget: boolean,
): InsertMode => {
  // 左側ターゲットは常にchild
  if (isLeftTarget) {
    return 'child';
  }

  // 同列ターゲットは中心Yで上下2分割
  const targetCenterY = targetNode.y + NODE_HEIGHT / 2;
  return draggedCenterY < targetCenterY ? 'before' : 'after';
};
