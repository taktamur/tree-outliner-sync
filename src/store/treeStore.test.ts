import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTreeStore } from './treeStore';
import type { TreeNode } from '../types/tree';
import * as idGenerator from '../utils/idGenerator';

describe('treeStore', () => {
  beforeEach(() => {
    // 各テストの前にストアをリセット
    const { setNodes, setSelectedNodeId } = useTreeStore.getState();
    setNodes([]);
    setSelectedNodeId(null);
  });

  describe('初期状態', () => {
    it('サンプルデータが初期化される', () => {
      // ストアを新規作成して初期状態を確認
      const state = useTreeStore.getState();
      expect(state.nodes.length).toBeGreaterThan(0);
      expect(state.selectedNodeId).toBeNull();
    });

    it('サンプルデータにルートノードが含まれる', () => {
      const state = useTreeStore.getState();
      const rootNodes = state.nodes.filter((n) => n.parentId === null);
      expect(rootNodes.length).toBeGreaterThan(0);
    });
  });

  describe('updateNodeText', () => {
    it('ノードのテキストを更新できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Original', parentId: null, order: 0 },
      ];
      const { setNodes, updateNodeText } = useTreeStore.getState();
      setNodes(testNodes);

      updateNodeText('node1', 'Updated');

      const state = useTreeStore.getState();
      expect(state.nodes[0].text).toBe('Updated');
    });

    it('存在しないノードの更新は他のノードに影響しない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Text1', parentId: null, order: 0 },
        { id: 'node2', text: 'Text2', parentId: null, order: 1 },
      ];
      const { setNodes, updateNodeText } = useTreeStore.getState();
      setNodes(testNodes);

      updateNodeText('nonexistent', 'Updated');

      const state = useTreeStore.getState();
      expect(state.nodes[0].text).toBe('Text1');
      expect(state.nodes[1].text).toBe('Text2');
    });
  });

  describe('indent', () => {
    it('ノードをインデントできる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes, indent } = useTreeStore.getState();
      setNodes(testNodes);

      indent('node2');

      const state = useTreeStore.getState();
      const node2 = state.nodes.find((n) => n.id === 'node2');
      expect(node2?.parentId).toBe('node1');
    });

    it('インデント不可能な場合は変更しない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      ];
      const { setNodes, indent } = useTreeStore.getState();
      setNodes(testNodes);

      indent('node1'); // 最初のノードはインデント不可

      const state = useTreeStore.getState();
      expect(state.nodes[0].parentId).toBeNull();
    });
  });

  describe('outdent', () => {
    it('ノードをアウトデントできる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: 'node1', order: 0 },
      ];
      const { setNodes, outdent } = useTreeStore.getState();
      setNodes(testNodes);

      outdent('node2');

      const state = useTreeStore.getState();
      const node2 = state.nodes.find((n) => n.id === 'node2');
      expect(node2?.parentId).toBeNull();
    });

    it('すでにルートレベルの場合は変更しない', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      ];
      const { setNodes, outdent } = useTreeStore.getState();
      setNodes(testNodes);

      outdent('node1');

      const state = useTreeStore.getState();
      expect(state.nodes[0].parentId).toBeNull();
    });
  });

  describe('addAfter', () => {
    it('指定ノードの直後に新しいノードを追加できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      ];
      const { setNodes, addAfter } = useTreeStore.getState();
      setNodes(testNodes);

      // IDを固定してテスト
      vi.spyOn(idGenerator, 'generateId').mockReturnValue('new-node-id');

      const newId = addAfter('node1');

      const state = useTreeStore.getState();
      expect(newId).toBe('new-node-id');
      expect(state.nodes.length).toBe(2);
      expect(state.selectedNodeId).toBe('new-node-id');

      const newNode = state.nodes.find((n) => n.id === 'new-node-id');
      expect(newNode).toBeDefined();
      expect(newNode?.text).toBe('');

      vi.restoreAllMocks();
    });

    it('新しいノードが自動的に選択される', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      ];
      const { setNodes, addAfter, setSelectedNodeId } = useTreeStore.getState();
      setNodes(testNodes);
      setSelectedNodeId('node1');

      vi.spyOn(idGenerator, 'generateId').mockReturnValue('new-node-id');

      addAfter('node1');

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('new-node-id');

      vi.restoreAllMocks();
    });
  });

  describe('remove', () => {
    it('ノードを削除できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
      ];
      const { setNodes, remove } = useTreeStore.getState();
      setNodes(testNodes);

      remove('node2');

      const state = useTreeStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes.find((n) => n.id === 'node2')).toBeUndefined();
    });

    it('子ノードを持つノードを削除すると子は昇格する', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: 'node1', order: 0 },
      ];
      const { setNodes, remove } = useTreeStore.getState();
      setNodes(testNodes);

      remove('node1');

      const state = useTreeStore.getState();
      const node2 = state.nodes.find((n) => n.id === 'node2');
      expect(node2?.parentId).toBeNull(); // 子がルートに昇格
    });
  });

  describe('move', () => {
    it('ノードを別の親の下に移動できる', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: null, order: 1 },
        { id: 'node3', text: 'Node3', parentId: null, order: 2 },
      ];
      const { setNodes, move } = useTreeStore.getState();
      setNodes(testNodes);

      move('node3', 'node1');

      const state = useTreeStore.getState();
      const node3 = state.nodes.find((n) => n.id === 'node3');
      expect(node3?.parentId).toBe('node1');
    });

    it('循環参照を防ぐため子孫への移動は失敗する', () => {
      const testNodes: TreeNode[] = [
        { id: 'node1', text: 'Node1', parentId: null, order: 0 },
        { id: 'node2', text: 'Node2', parentId: 'node1', order: 0 },
      ];
      const { setNodes, move } = useTreeStore.getState();
      setNodes(testNodes);

      move('node1', 'node2'); // 親を自分の子の下に移動しようとする

      const state = useTreeStore.getState();
      const node1 = state.nodes.find((n) => n.id === 'node1');
      expect(node1?.parentId).toBeNull(); // 変更されない
    });
  });

  describe('setSelectedNodeId', () => {
    it('選択中のノードIDを設定できる', () => {
      const { setSelectedNodeId } = useTreeStore.getState();

      setSelectedNodeId('node1');

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBe('node1');
    });

    it('選択を解除できる（nullを設定）', () => {
      const { setSelectedNodeId } = useTreeStore.getState();
      setSelectedNodeId('node1');

      setSelectedNodeId(null);

      const state = useTreeStore.getState();
      expect(state.selectedNodeId).toBeNull();
    });
  });

  describe('setNodes', () => {
    it('ノードリスト全体を置き換えられる', () => {
      const newNodes: TreeNode[] = [
        { id: 'new1', text: 'New1', parentId: null, order: 0 },
        { id: 'new2', text: 'New2', parentId: null, order: 1 },
      ];
      const { setNodes } = useTreeStore.getState();

      setNodes(newNodes);

      const state = useTreeStore.getState();
      expect(state.nodes).toEqual(newNodes);
      expect(state.nodes.length).toBe(2);
    });
  });
});
