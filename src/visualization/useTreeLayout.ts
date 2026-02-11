/**
 * ツリーレイアウトフック
 *
 * ツリーノードのレイアウト計算結果をReact Flow形式で提供する。
 * elkjsの非同期APIに対応し、ローディング状態を管理する。
 */
import { useEffect, useState } from 'react';
import { useTreeStore } from '../store/treeStore';
import { calculateLayout } from './layoutCalculator';
import type { Node, Edge } from '@xyflow/react';

/**
 * ツリーストアの状態からReact Flow用のノードとエッジを計算する
 *
 * @returns React Flow用のノードとエッジのオブジェクト、およびローディング状態
 */
export const useTreeLayout = (): {
  nodes: Node[];
  edges: Edge[];
  isLayouting: boolean;
} => {
  const storeNodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  const [layoutState, setLayoutState] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({ nodes: [], edges: [] });

  const [isLayouting, setIsLayouting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const computeLayout = async () => {
      setIsLayouting(true);

      try {
        // elkjsレイアウト計算を実行（非同期）
        const layout = await calculateLayout(storeNodes);

        if (cancelled) return;

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

        setLayoutState({ nodes, edges });
      } finally {
        if (!cancelled) {
          setIsLayouting(false);
        }
      }
    };

    computeLayout();

    // クリーンアップ関数: コンポーネントがアンマウントされたらキャンセル
    return () => {
      cancelled = true;
    };
  }, [storeNodes, selectedNodeId]);

  return { ...layoutState, isLayouting };
};
