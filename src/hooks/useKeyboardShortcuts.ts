import { useCallback } from 'react';
import { useTreeStore } from '../store/treeStore';
import { getFlattenedOrder } from '../utils/treeOperations';

/**
 * アウトライナーのキーボードショートカットを提供するカスタムフック
 * 各OutlinerItemで使用され、標準的なアウトライナー操作を実現
 * @param nodeId 対象ノードのID
 * @returns キーダウンイベントハンドラ
 */
export const useKeyboardShortcuts = (nodeId: string) => {
  const { nodes, indent, outdent, addAfter, remove, setSelectedNodeId } = useTreeStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // DFS順（表示順）のフラットリストを取得
      const flatOrder = getFlattenedOrder(nodes);
      const currentIdx = flatOrder.findIndex((n) => n.id === nodeId);

      // Tab: インデント（階層を深くする）
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        indent(nodeId);
      }
      // Shift+Tab: アウトデント（階層を浅くする）
      else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        outdent(nodeId);
      }
      // Enter: 直後に新しいノードを追加
      else if (e.key === 'Enter') {
        e.preventDefault();
        addAfter(nodeId);
      }
      // Backspace（空ノード時）: ノードを削除し、前のノードにフォーカス
      else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
        e.preventDefault();
        // 削除前に移動先を決定（前のノード、なければ次のノード）
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        } else if (flatOrder.length > 1) {
          setSelectedNodeId(flatOrder[1]?.id ?? null);
        }
        remove(nodeId);
      }
      // ArrowUp: 前のノードにフォーカス移動
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        }
      }
      // ArrowDown: 次のノードにフォーカス移動
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIdx < flatOrder.length - 1) {
          setSelectedNodeId(flatOrder[currentIdx + 1].id);
        }
      }
    },
    [nodes, nodeId, indent, outdent, addAfter, remove, setSelectedNodeId],
  );

  return handleKeyDown;
};
