import type { TreeNode } from './types';

/** 指定parentIdの子ノードをorder順で取得 */
export const getChildren = (nodes: TreeNode[], parentId: string | null): TreeNode[] =>
  nodes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order);

/** 指定ノードの全子孫IDを取得 */
export const getDescendantIds = (nodes: TreeNode[], nodeId: string): string[] => {
  const children = nodes.filter((n) => n.parentId === nodeId);
  return children.flatMap((c) => [c.id, ...getDescendantIds(nodes, c.id)]);
};

/** フラットリストをDFS順（アウトライナー表示順）に並べ替え */
export const getFlattenedOrder = (nodes: TreeNode[]): TreeNode[] => {
  const result: TreeNode[] = [];
  const visit = (parentId: string | null) => {
    const children = getChildren(nodes, parentId);
    for (const child of children) {
      result.push(child);
      visit(child.id);
    }
  };
  visit(null);
  return result;
};

/** ノードの深さを取得 */
export const getDepth = (nodes: TreeNode[], nodeId: string): number => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !node.parentId) return 0;
  return 1 + getDepth(nodes, node.parentId);
};

/**
 * インデント: 直上の兄弟の子にする
 * 直上の兄弟がいない場合は操作不可
 */
export const indentNode = (nodes: TreeNode[], nodeId: string): TreeNode[] | null => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const siblings = getChildren(nodes, node.parentId);
  const idx = siblings.findIndex((s) => s.id === nodeId);
  if (idx <= 0) return null; // 最初の兄弟はインデント不可

  const newParentId = siblings[idx - 1].id;
  const newSiblings = getChildren(nodes, newParentId);
  const maxOrder = newSiblings.length > 0 ? Math.max(...newSiblings.map((s) => s.order)) + 1 : 0;

  return nodes.map((n) =>
    n.id === nodeId ? { ...n, parentId: newParentId, order: maxOrder } : n,
  );
};

/**
 * アウトデント: 親の兄弟にする（親の直後に配置）
 * ルートノードの場合は操作不可
 */
export const outdentNode = (nodes: TreeNode[], nodeId: string): TreeNode[] | null => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || !node.parentId) return null; // ルートはアウトデント不可

  const parent = nodes.find((n) => n.id === node.parentId);
  if (!parent) return null;

  const grandparentId = parent.parentId;
  // 親の直後に挿入するためorderを調整
  const newOrder = parent.order + 0.5;

  const updated = nodes.map((n) =>
    n.id === nodeId ? { ...n, parentId: grandparentId, order: newOrder } : n,
  );

  // orderを正規化
  return normalizeOrders(updated, grandparentId);
};

/** 兄弟間のorderを0,1,2...に正規化 */
export const normalizeOrders = (nodes: TreeNode[], parentId: string | null): TreeNode[] => {
  const siblings = nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);

  const orderMap = new Map<string, number>();
  siblings.forEach((s, i) => orderMap.set(s.id, i));

  return nodes.map((n) => (orderMap.has(n.id) ? { ...n, order: orderMap.get(n.id)! } : n));
};

/**
 * ノード追加: 指定ノードの直後に同階層の兄弟を追加
 */
export const addNodeAfter = (
  nodes: TreeNode[],
  afterNodeId: string,
  newNode: TreeNode,
): TreeNode[] => {
  const afterNode = nodes.find((n) => n.id === afterNodeId);
  if (!afterNode) return [...nodes, newNode];

  const withNew = [
    ...nodes,
    { ...newNode, parentId: afterNode.parentId, order: afterNode.order + 0.5 },
  ];
  return normalizeOrders(withNew, afterNode.parentId);
};

/**
 * ノード削除: 子を一つ上の階層に昇格
 */
export const deleteNode = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return nodes;

  const children = nodes.filter((n) => n.parentId === nodeId);
  const promoted = children.map((c) => ({
    ...c,
    parentId: node.parentId,
    order: node.order + (c.order + 1) * 0.01,
  }));

  const filtered = nodes.filter((n) => n.id !== nodeId && n.parentId !== nodeId);
  const result = [...filtered, ...promoted];
  return normalizeOrders(result, node.parentId);
};

/**
 * ノードを指定ノードの直前に兄弟として挿入
 *
 * @param nodes ツリーノードの配列
 * @param nodeId 移動するノードのID
 * @param targetNodeId 挿入先のターゲットノードID
 * @returns 更新後のノード配列（移動不可の場合はnull）
 */
export const moveNodeBefore = (
  nodes: TreeNode[],
  nodeId: string,
  targetNodeId: string,
): TreeNode[] | null => {
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) return null;

  // ターゲットノードと同じ親、orderは-0.5
  return moveNode(nodes, nodeId, targetNode.parentId, targetNode.order - 0.5);
};

/**
 * ノードを指定ノードの直後に兄弟として挿入
 *
 * @param nodes ツリーノードの配列
 * @param nodeId 移動するノードのID
 * @param targetNodeId 挿入先のターゲットノードID
 * @returns 更新後のノード配列（移動不可の場合はnull）
 */
export const moveNodeAfter = (
  nodes: TreeNode[],
  nodeId: string,
  targetNodeId: string,
): TreeNode[] | null => {
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) return null;

  // ターゲットノードと同じ親、orderは+0.5
  return moveNode(nodes, nodeId, targetNode.parentId, targetNode.order + 0.5);
};

/**
 * ノードを指定ノードの子の先頭に挿入
 *
 * @param nodes ツリーノードの配列
 * @param nodeId 移動するノードのID
 * @param targetNodeId 新しい親ノードのID
 * @returns 更新後のノード配列（移動不可の場合はnull）
 */
export const moveNodeAsFirstChild = (
  nodes: TreeNode[],
  nodeId: string,
  targetNodeId: string,
): TreeNode[] | null => {
  // ターゲットノードを親とし、orderは-0.5で先頭に配置
  return moveNode(nodes, nodeId, targetNodeId, -0.5);
};

/**
 * ノード移動: あるノードを別のノードの子にする（D&D用）
 * 循環参照チェック付き
 *
 * @param nodes ツリーノードの配列
 * @param nodeId 移動するノードのID
 * @param newParentId 新しい親ノードのID（nullの場合はルート化）
 * @param insertOrder 挿入位置のorder値（undefinedの場合は末尾に追加）
 * @returns 更新後のノード配列（移動不可の場合はnull）
 */
export const moveNode = (
  nodes: TreeNode[],
  nodeId: string,
  newParentId: string | null,
  insertOrder?: number,
): TreeNode[] | null => {
  if (nodeId === newParentId) return null;

  // 循環参照チェック: newParentIdがnodeIdの子孫でないことを確認
  if (newParentId !== null) {
    const descendantIds = getDescendantIds(nodes, nodeId);
    if (descendantIds.includes(newParentId)) return null;
  }

  // insertOrderが指定されていればそれを使用、なければ末尾に追加
  const targetOrder = insertOrder ?? (() => {
    const newSiblings = getChildren(nodes, newParentId);
    return newSiblings.length > 0 ? Math.max(...newSiblings.map((s) => s.order)) + 1 : 0;
  })();

  const updated = nodes.map((n) =>
    n.id === nodeId ? { ...n, parentId: newParentId, order: targetOrder } : n,
  );

  return normalizeOrders(updated, newParentId);
};
