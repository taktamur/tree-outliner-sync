import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useTreeStore } from '../store/treeStore';
import type { TreeNode } from '../types/tree';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // 各テストの前にストアをリセット
    const { setNodes, setSelectedNodeId } = useTreeStore.getState();
    setNodes([]);
    setSelectedNodeId(null);
  });

  const createKeyboardEvent = (
    key: string,
    options: { shiftKey?: boolean; value?: string } = {},
  ): React.KeyboardEvent<HTMLInputElement> => {
    const event = {
      key,
      shiftKey: options.shiftKey ?? false,
      preventDefault: () => {},
      target: { value: options.value ?? '' } as HTMLInputElement,
    } as React.KeyboardEvent<HTMLInputElement>;
    return event;
  };

  describe('Tab（インデント）', () => {
    it('Tabキーでインデントできる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('Tab');

      result.current(event);

      const state = useTreeStore.getState();
      const node2 = state.nodes.find((n) => n.id === 'node2');
      expect(node2?.parentId).toBe('node1');
    });
  });

  describe('Shift+Tab（アウトデント）', () => {
    it('Shift+Tabキーでアウトデントできる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: 'node1', order: 0 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('Tab', { shiftKey: true });

      result.current(event);

      const state = useTreeStore.getState();
      const node2 = state.nodes.find((n) => n.id === 'node2');
      expect(node2?.parentId).toBeNull();
    });
  });

  describe('Enter（新規ノード追加）', () => {
    it('Enterキーで新しいノードを追加できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node1'));
      const event = createKeyboardEvent('Enter');

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.nodes.length).toBe(2);
      // 新しいノードが選択される
      expect(state.selectedNodeId).not.toBeNull();
      expect(state.selectedNodeId).not.toBe('node1');
    });
  });

  describe('Backspace（空ノード削除）', () => {
    it('空のノードでBackspaceを押すと削除される', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: '', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('Backspace', { value: '' });

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes.find((n) => n.id === 'node2')).toBeUndefined();
      // フォーカスが前のノードに移動
      expect(state.selectedNodeId).toBe('node1');
    });

    it('テキストがある場合はBackspaceで削除されない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('Backspace', { value: 'Node2' });

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.nodes.length).toBe(2);
      expect(state.nodes.find((n) => n.id === 'node2')).toBeDefined();
    });

    it('最初のノードを削除した場合、次のノードにフォーカス', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: '', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node1'));
      const event = createKeyboardEvent('Backspace', { value: '' });

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.selectedNodeId).toBe('node2');
    });
  });

  describe('ArrowUp（上移動）', () => {
    it('↑キーで前のノードに移動できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('ArrowUp');

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('node1');
    });

    it('最初のノードで↑を押しても何も起きない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes, setSelectedNodeId } = useTreeStore.getState();
      setNodes(testNodes);
      setSelectedNodeId('node1');

      const { result } = renderHook(() => useKeyboardShortcuts('node1'));
      const event = createKeyboardEvent('ArrowUp');

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('node1');
    });
  });

  describe('ArrowDown（下移動）', () => {
    it('↓キーで次のノードに移動できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      const { result } = renderHook(() => useKeyboardShortcuts('node1'));
      const event = createKeyboardEvent('ArrowDown');

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('node2');
    });

    it('最後のノードで↓を押しても何も起きない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes, setSelectedNodeId } = useTreeStore.getState();
      setNodes(testNodes);
      setSelectedNodeId('node2');

      const { result } = renderHook(() => useKeyboardShortcuts('node2'));
      const event = createKeyboardEvent('ArrowDown');

      result.current(event);

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('node2');
    });
  });

  describe('ネストされた構造での移動', () => {
    it('ネストされたノード間でも正しく移動できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child2', parentId: 'root', order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();
      setNodes(testNodes);

      // child1 → child2に移動
      const { result: result1 } = renderHook(() => useKeyboardShortcuts('child1'));
      const event1 = createKeyboardEvent('ArrowDown');
      result1.current(event1);

      let state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('child2');

      // child2 → child1に移動
      const { result: result2 } = renderHook(() => useKeyboardShortcuts('child2'));
      const event2 = createKeyboardEvent('ArrowUp');
      result2.current(event2);

      state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('child1');
    });
  });
});
