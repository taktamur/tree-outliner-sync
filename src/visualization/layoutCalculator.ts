/**
 * ツリー可視化のレイアウト計算
 *
 * dagreライブラリを使用してツリー構造をLR（左→右）方向にレイアウトする。
 * 複数のルートノードがある場合は、それぞれを個別にレイアウトして縦方向に積み重ねる。
 */
import dagre from 'dagre';
import type { TreeNode } from '../store/types';
import { getChildren } from '../store/operations';
import { calculateNodeWidth } from '../shared/textMeasure';

/** ノードの基本幅（px） */
const BASE_NODE_WIDTH = 80;
/** ノードの高さ（px） */
const NODE_HEIGHT = 40;
/** ツリー間の縦方向の間隔（px） */
const TREE_GAP = 60;

/** React Flow用のレイアウト済みノード */
interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  type: string;
}

/** React Flow用のエッジ（接続線） */
interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

/** レイアウト計算の結果 */
interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

/**
 * 単一のサブツリーをdagreでレイアウト計算
 *
 * @param allNodes 全ツリーノード
 * @param rootId サブツリーのルートノードID
 * @param yOffset このサブツリーの縦方向オフセット（複数ツリーを縦積みする際に使用）
 * @returns レイアウト済みノード、エッジ、およびサブツリーの高さ
 */
const layoutSubtree = (
  allNodes: TreeNode[],
  rootId: string,
  yOffset: number,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; height: number } => {
  // dagreグラフを初期化（LR方向: 左→右）
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

  // ノード幅を計算してマップに保存（後で使用）
  const nodeWidths = new Map<string, number>();
  subtreeNodes.forEach((n) => {
    const width = calculateNodeWidth(n.text || '...');
    nodeWidths.set(n.id, width);
  });

  // dagreにノードを追加（テキストに基づく動的サイズ指定）
  subtreeNodes.forEach((n) => {
    const width = nodeWidths.get(n.id) ?? BASE_NODE_WIDTH;
    g.setNode(n.id, { width, height: NODE_HEIGHT });
  });

  // dagreにエッジ（親子関係）を追加
  const edges: LayoutEdge[] = [];
  subtreeNodes.forEach((n) => {
    if (n.parentId && subtreeNodes.some((sn) => sn.id === n.parentId)) {
      g.setEdge(n.parentId, n.id);
      edges.push({ id: `e-${n.parentId}-${n.id}`, source: n.parentId, target: n.id });
    }
  });

  // dagreレイアウト計算を実行
  dagre.layout(g);

  // dagreの計算結果を取得し、yOffsetを適用してReact Flow形式に変換
  let minY = Infinity;
  let maxY = -Infinity;
  const layoutNodes: LayoutNode[] = subtreeNodes.map((n) => {
    const dagreNode = g.node(n.id);
    const nodeWidth = nodeWidths.get(n.id) ?? BASE_NODE_WIDTH;
    const y = dagreNode.y + yOffset;
    minY = Math.min(minY, y - NODE_HEIGHT / 2);
    maxY = Math.max(maxY, y + NODE_HEIGHT / 2);
    return {
      id: n.id,
      // dagreはノード中心座標を返すため、左上座標に変換
      // 各ノードの実際の幅を使用
      position: { x: dagreNode.x - nodeWidth / 2, y: y - NODE_HEIGHT / 2 },
      data: { label: n.text || '...' },
      type: 'custom',
    };
  });

  // サブツリーの高さを計算（次のツリーの配置に使用）
  const height = maxY - minY;
  return { nodes: layoutNodes, edges, height };
};

/**
 * 全ルートのサブツリーを縦に積んでレイアウト
 *
 * 複数のルートノードが存在する場合、それぞれを個別にレイアウト計算し、
 * 縦方向（Y軸）にTREE_GAPの間隔で積み重ねる。
 *
 * @param nodes 全ツリーノード
 * @returns 全ノードとエッジのレイアウト結果
 */
export const calculateLayout = (nodes: TreeNode[]): LayoutResult => {
  const roots = getChildren(nodes, null);
  const allLayoutNodes: LayoutNode[] = [];
  const allEdges: LayoutEdge[] = [];

  let yOffset = 0;
  roots.forEach((root) => {
    const { nodes: layoutNodes, edges, height } = layoutSubtree(nodes, root.id, yOffset);
    allLayoutNodes.push(...layoutNodes);
    allEdges.push(...edges);
    yOffset += height + TREE_GAP; // 次のツリーのために高さ+間隔を加算
  });

  return { nodes: allLayoutNodes, edges: allEdges };
};
