import { useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { calculateLayout } from '../utils/layoutCalculator';
import type { Node, Edge } from '@xyflow/react';

/**
 * ツリーレイアウトを計算するカスタムフック
 * ストアのノードデータからReact Flow用のノードとエッジを生成
 * ノードが変更されるたびに自動的に再計算される（useMemoでキャッシュ）
 */
export const useTreeLayout = (): { nodes: Node[]; edges: Edge[] } => {
  const storeNodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  return useMemo(() => {
    // dagreを使用してレイアウト計算
    const layout = calculateLayout(storeNodes);

    // React Flow用のノード形式に変換（選択状態も含める）
    const nodes: Node[] = layout.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: { ...n.data, selected: n.id === selectedNodeId },
      type: 'custom',
    }));

    // React Flow用のエッジ形式に変換（スタイル設定を含む）
    const edges: Edge[] = layout.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep', // なめらかな曲線のエッジ
      style: { stroke: '#888', strokeWidth: 1.5 },
    }));

    return { nodes, edges };
  }, [storeNodes, selectedNodeId]); // これらが変わった時だけ再計算
};
