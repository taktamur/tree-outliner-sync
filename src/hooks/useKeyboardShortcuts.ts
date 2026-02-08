/**
 * キーボードショートカットフック
 *
 * アウトライナーエディタの操作に必要なキーボードショートカットを提供する。
 * - Tab: インデント（階層を深くする）
 * - Shift+Tab: アウトデント（階層を浅くする）
 * - Enter: 新しいノードを追加
 * - Backspace: 空のノードを削除
 * - ↑/↓: ノード間を移動
 */
import { useCallback } from 'react';
import { useTreeStore } from '../store/treeStore';
import { getFlattenedOrder } from '../utils/treeOperations';

/**
 * 指定ノードに対するキーボードイベントハンドラを生成
 *
 * @param nodeId 操作対象のノードID
 * @returns キーダウンイベントハンドラ
 */
export const useKeyboardShortcuts = (nodeId: string) => {
  const { nodes, indent, outdent, addAfter, remove, setSelectedNodeId } = useTreeStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // DFS順（表示順）でのノードリストを取得
      const flatOrder = getFlattenedOrder(nodes);
      const currentIdx = flatOrder.findIndex((n) => n.id === nodeId);

      if (e.key === 'Tab' && !e.shiftKey) {
        // Tab: インデント
        e.preventDefault();
        indent(nodeId);
      } else if (e.key === 'Tab' && e.shiftKey) {
        // Shift+Tab: アウトデント
        e.preventDefault();
        outdent(nodeId);
      } else if (e.key === 'Enter') {
        // Enter: 新しいノードを現在のノードの直後に追加
        // IME変換中（日本語入力の確定など）の場合はスキップ
        if (e.nativeEvent.isComposing) {
          return;
        }
        e.preventDefault();
        addAfter(nodeId);
      } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
        // Backspace: 空のノードを削除（テキストが空の場合のみ）
        e.preventDefault();
        // 削除前にフォーカス先を決定（前のノードに移動）
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        } else if (flatOrder.length > 1) {
          setSelectedNodeId(flatOrder[1]?.id ?? null);
        }
        remove(nodeId);
      } else if (e.key === 'ArrowUp') {
        // ↑: 前のノードに移動
        e.preventDefault();
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        }
      } else if (e.key === 'ArrowDown') {
        // ↓: 次のノードに移動
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
