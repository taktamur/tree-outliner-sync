import dagre from 'dagre';
import type { TreeNode } from '../types/tree';
import { getChildren } from './treeOperations';

// ノードのサイズとツリー間のギャップ定数
const NODE_WIDTH = 150;
const NODE_HEIGHT = 40;
const TREE_GAP = 60; // 複数ルート間の縦方向スペース

/** React Flow用のノード表示情報 */
interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  type: string;
}

/** React Flow用のエッジ（矢印）表示情報 */
interface LayoutEdge {
  id: string;
  source: string; // 開始ノードID
  target: string; // 終了ノードID
}

/** レイアウト計算の結果 */
interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

/**
 * 単一のサブツリーをdagreでレイアウト計算
 * @param allNodes 全ノードリスト
 * @param rootId サブツリーのルートノードID
 * @param yOffset 縦方向のオフセット（複数ルートを縦に並べるため）
 * @returns レイアウトされたノード・エッジと高さ
 */
const layoutSubtree = (
  allNodes: TreeNode[],
  rootId: string,
  yOffset: number,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; height: number } => {
  // dagreグラフを作成（LR = 左から右へのレイアウト）
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 20, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  // サブツリーのノードを再帰的に収集
  const subtreeNodes: TreeNode[] = [];
  const collectNodes = (parentId: string) => {
    const node = allNodes.find((n) => n.id === parentId);
    if (node) subtreeNodes.push(node);
    const children = getChildren(allNodes, parentId);
    children.forEach((c) => collectNodes(c.id));
  };
  collectNodes(rootId);

  // dagreグラフにノードを追加
  subtreeNodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // dagreグラフにエッジ（親子関係）を追加
  const edges: LayoutEdge[] = [];
  subtreeNodes.forEach((n) => {
    if (n.parentId && subtreeNodes.some((sn) => sn.id === n.parentId)) {
      g.setEdge(n.parentId, n.id);
      edges.push({ id: `e-${n.parentId}-${n.id}`, source: n.parentId, target: n.id });
    }
  });

  // dagreレイアウトアルゴリズムを実行
  dagre.layout(g);

  // dagreの計算結果を取得し、yOffsetを適用して座標を確定
  let minY = Infinity;
  let maxY = -Infinity;
  const layoutNodes: LayoutNode[] = subtreeNodes.map((n) => {
    const dagreNode = g.node(n.id);
    const y = dagreNode.y + yOffset;
    minY = Math.min(minY, y - NODE_HEIGHT / 2);
    maxY = Math.max(maxY, y + NODE_HEIGHT / 2);
    return {
      id: n.id,
      position: { x: dagreNode.x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { label: n.text || '...' },
      type: 'custom',
    };
  });

  // このサブツリーの高さを計算（次のツリーのオフセット計算に使用）
  const height = maxY - minY;
  return { nodes: layoutNodes, edges, height };
};

/**
 * 全ルートのサブツリーを縦に積んでレイアウト
 * 複数のルートノードがある場合、それぞれを個別にレイアウトして縦に配置
 * @param nodes 全ノードリスト
 * @returns React Flow用のノードとエッジのレイアウト情報
 */
export const calculateLayout = (nodes: TreeNode[]): LayoutResult => {
  const roots = getChildren(nodes, null); // ルートノードを取得
  const allLayoutNodes: LayoutNode[] = [];
  const allEdges: LayoutEdge[] = [];

  // 各ルートツリーを順番にレイアウトし、縦にオフセットして配置
  let yOffset = 0;
  roots.forEach((root) => {
    const { nodes: layoutNodes, edges, height } = layoutSubtree(nodes, root.id, yOffset);
    allLayoutNodes.push(...layoutNodes);
    allEdges.push(...edges);
    yOffset += height + TREE_GAP; // 次のツリーのための縦方向オフセットを更新
  });

  return { nodes: allLayoutNodes, edges: allEdges };
};
