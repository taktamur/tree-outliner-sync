import dagre from 'dagre';
import type { TreeNode } from '../types/tree';
import { getChildren } from './treeOperations';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 40;
const TREE_GAP = 60;

interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string };
  type: string;
}

interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

/** 単一のサブツリーをdagreでレイアウト計算 */
const layoutSubtree = (
  allNodes: TreeNode[],
  rootId: string,
  yOffset: number,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; height: number } => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 20, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  // サブツリーのノードを収集
  const subtreeNodes: TreeNode[] = [];
  const collectNodes = (parentId: string) => {
    const node = allNodes.find((n) => n.id === parentId);
    if (node) subtreeNodes.push(node);
    const children = getChildren(allNodes, parentId);
    children.forEach((c) => collectNodes(c.id));
  };
  collectNodes(rootId);

  // dagreにノードとエッジを追加
  subtreeNodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  const edges: LayoutEdge[] = [];
  subtreeNodes.forEach((n) => {
    if (n.parentId && subtreeNodes.some((sn) => sn.id === n.parentId)) {
      g.setEdge(n.parentId, n.id);
      edges.push({ id: `e-${n.parentId}-${n.id}`, source: n.parentId, target: n.id });
    }
  });

  dagre.layout(g);

  // dagreの結果を取得し、yOffsetを適用
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

  const height = maxY - minY;
  return { nodes: layoutNodes, edges, height };
};

/** 全ルートのサブツリーを縦に積んでレイアウト */
export const calculateLayout = (nodes: TreeNode[]): LayoutResult => {
  const roots = getChildren(nodes, null);
  const allLayoutNodes: LayoutNode[] = [];
  const allEdges: LayoutEdge[] = [];

  let yOffset = 0;
  roots.forEach((root) => {
    const { nodes: layoutNodes, edges, height } = layoutSubtree(nodes, root.id, yOffset);
    allLayoutNodes.push(...layoutNodes);
    allEdges.push(...edges);
    yOffset += height + TREE_GAP;
  });

  return { nodes: allLayoutNodes, edges: allEdges };
};
