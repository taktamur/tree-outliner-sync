/**
 * ツリー可視化のレイアウト計算
 *
 * elkjsライブラリを使用してツリー構造をLR（左→右）方向にレイアウトする。
 * 複数のルートノードがある場合は、それぞれを個別にレイアウトして縦方向に積み重ねる。
 */
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api';
import type { TreeNode } from '../store/types';
import { getChildren } from '../store/operations';

/** ノードの基本幅（px） */
export const BASE_NODE_WIDTH = 80;
/** ノードの高さ（px） */
export const NODE_HEIGHT = 40;
/** ツリー間の縦方向の間隔（px） */
const TREE_GAP = 60;
/** パディング（左右合計、px） */
export const HORIZONTAL_PADDING = 32; // 8px * 2 (padding) + 16px (余白)
/** 1文字あたりの概算幅（px） */
export const CHAR_WIDTH = 8;

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
 * テキストの長さからノードの概算幅を計算
 *
 * @param text ノードのテキスト
 * @returns 概算幅（px）
 */
export const calculateNodeWidth = (text: string): number => {
  const textWidth = text.length * CHAR_WIDTH;
  const totalWidth = Math.max(BASE_NODE_WIDTH, textWidth + HORIZONTAL_PADDING);
  return totalWidth;
};

/** ELKの型定義 */
type ELKConstructor = typeof import('elkjs/lib/elk.bundled.js').default;
type ELKInstance = InstanceType<ELKConstructor>;

/** elkインスタンスのキャッシュ */
let elkInstance: ELKInstance | null = null;

/**
 * elkインスタンスを取得（初回のみ動的import）
 */
const getElk = async (): Promise<ELKInstance> => {
  if (!elkInstance) {
    const ELK = (await import('elkjs/lib/elk.bundled.js')).default;
    elkInstance = new ELK();
  }
  return elkInstance;
};

/**
 * 単一のサブツリーをelkjsでレイアウト計算
 *
 * @param allNodes 全ツリーノード
 * @param rootId サブツリーのルートノードID
 * @param yOffset このサブツリーの縦方向オフセット（複数ツリーを縦積みする際に使用）
 * @returns レイアウト済みノード、エッジ、およびサブツリーの高さ
 */
const layoutSubtree = async (
  allNodes: TreeNode[],
  rootId: string,
  yOffset: number,
): Promise<{ nodes: LayoutNode[]; edges: LayoutEdge[]; height: number }> => {
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

  // elkjs用のフラットなノードリストを構築
  const elkNodes: ElkNode[] = subtreeNodes.map((node) => ({
    id: node.id,
    width: nodeWidths.get(node.id) ?? BASE_NODE_WIDTH,
    height: NODE_HEIGHT,
  }));

  // エッジを収集
  const edges: ElkExtendedEdge[] = [];
  subtreeNodes.forEach((n) => {
    if (n.parentId && subtreeNodes.some((sn) => sn.id === n.parentId)) {
      edges.push({
        id: `e-${n.parentId}-${n.id}`,
        sources: [n.parentId],
        targets: [n.id],
      });
    }
  });

  // elkjsでレイアウト計算
  const elk = await getElk();
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'LEFTUP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.semiInteractive': 'true',
    },
    children: elkNodes,
    edges,
  };

  const layout = await elk.layout(graph);

  // elkjsの結果をReact Flow形式に変換
  const layoutNodes: LayoutNode[] = [];
  let minY = Infinity;
  let maxY = -Infinity;

  // ルートコンテナの子ノードを処理
  layout.children?.forEach((elkNode) => {
    const treeNode = subtreeNodes.find((n) => n.id === elkNode.id);
    if (!treeNode) return;

    const x = elkNode.x ?? 0;
    const y = (elkNode.y ?? 0) + yOffset;

    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + NODE_HEIGHT);

    layoutNodes.push({
      id: elkNode.id,
      position: { x, y },
      data: { label: treeNode.text || '...' },
      type: 'custom',
    });
  });

  // React Flow用のエッジを作成
  const layoutEdges: LayoutEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.sources[0],
    target: e.targets[0],
  }));

  // サブツリーの高さを計算（次のツリーの配置に使用）
  const height = maxY - minY;
  return { nodes: layoutNodes, edges: layoutEdges, height };
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
export const calculateLayout = async (nodes: TreeNode[]): Promise<LayoutResult> => {
  const roots = getChildren(nodes, null);
  const allLayoutNodes: LayoutNode[] = [];
  const allEdges: LayoutEdge[] = [];

  let yOffset = 0;
  for (const root of roots) {
    const { nodes: layoutNodes, edges, height } = await layoutSubtree(nodes, root.id, yOffset);
    allLayoutNodes.push(...layoutNodes);
    allEdges.push(...edges);
    yOffset += height + TREE_GAP; // 次のツリーのために高さ+間隔を加算
  }

  return { nodes: allLayoutNodes, edges: allEdges };
};
