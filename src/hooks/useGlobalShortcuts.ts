/**
 * グローバルキーボードショートカット
 *
 * アプリケーション全体で動作するキーボードショートカットを管理する。
 * 現在はundo/redo機能のみ実装。
 */
import { useEffect } from 'react';
import { useTreeStore } from '../store/treeStore';

/**
 * グローバルショートカットを登録するカスタムフック
 *
 * 以下のショートカットに対応:
 * - Ctrl+Z (Windows/Linux) / Cmd+Z (Mac): Undo
 * - Ctrl+Shift+Z (Windows/Linux) / Cmd+Shift+Z (Mac): Redo
 */
export const useGlobalShortcuts = () => {
  const undo = useTreeStore((state) => state.undo);
  const redo = useTreeStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl (Windows/Linux) または Cmd (Mac)
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'z') {
        e.preventDefault();

        if (e.shiftKey) {
          // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
          redo();
        } else {
          // Ctrl+Z / Cmd+Z: Undo
          undo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);
};
