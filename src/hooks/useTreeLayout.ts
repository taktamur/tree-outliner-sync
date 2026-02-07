/**
 * ツリーレイアウトフック
 *
 * ツリーノードのレイアウト計算結果をReact Flow形式で提供する。
 * useMemoでキャッシングすることで、ストアの状態が変わらない限り再計算を回避する。
 */
import { useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { calculateLayout } from '../utils/layoutCalculator';
import type { Node, Edge } from '@xyflow/react';

/**
 * ツリーストアの状態からReact Flow用のノードとエッジを計算する
 *
 * @returns React Flow用のノードとエッジのオブジェクト
 */
export const useTreeLayout = (): { nodes: Node[]; edges: Edge[] } => {
  const storeNodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  return useMemo(() => {
    // dagreレイアウト計算を実行
    const layout = calculateLayout(storeNodes);

    // レイアウト結果をReact Flow形式に変換
    const nodes: Node[] = layout.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: { ...n.data, selected: n.id === selectedNodeId }, // 選択状態を追加
      type: 'custom',
    }));

    const edges: Edge[] = layout.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep', // 滑らかな曲線
      style: { stroke: '#888', strokeWidth: 1.5 },
    }));

    return { nodes, edges };
  }, [storeNodes, selectedNodeId]); // これらが変わったときのみ再計算
};
