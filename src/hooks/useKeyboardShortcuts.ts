import { useCallback } from 'react';
import { useTreeStore } from '../store/treeStore';
import { getFlattenedOrder } from '../utils/treeOperations';

export const useKeyboardShortcuts = (nodeId: string) => {
  const { nodes, indent, outdent, addAfter, remove, setSelectedNodeId } = useTreeStore();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const flatOrder = getFlattenedOrder(nodes);
      const currentIdx = flatOrder.findIndex((n) => n.id === nodeId);

      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        indent(nodeId);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        outdent(nodeId);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addAfter(nodeId);
      } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
        e.preventDefault();
        // 削除前にフォーカス先を決定
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        } else if (flatOrder.length > 1) {
          setSelectedNodeId(flatOrder[1]?.id ?? null);
        }
        remove(nodeId);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIdx > 0) {
          setSelectedNodeId(flatOrder[currentIdx - 1].id);
        }
      } else if (e.key === 'ArrowDown') {
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
