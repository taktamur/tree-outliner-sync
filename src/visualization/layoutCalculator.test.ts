import { describe, it, expect } from 'vitest';
import type { TreeNode } from '../store/types';
import { calculateLayout } from './layoutCalculator';

describe('layoutCalculator', () => {
  describe('calculateLayout', () => {
    // 単一ルートノードのツリーに対してレイアウトを計算するテスト
    it('should calculate layout for single root tree', async () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);

      // Check that all nodes have positions
      result.nodes.forEach((node) => {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(node.data.label).toBeDefined();
        expect(node.type).toBe('custom');
      });

      // Check edges
      const edgeIds = result.edges.map((e) => e.id);
      expect(edgeIds).toContain('e-root-child1');
      expect(edgeIds).toContain('e-root-child2');
    });

    // 複数ルートノードのツリーに対してレイアウトを計算し、縦方向に配置されることを確認
    it('should calculate layout for multiple root trees', async () => {
      const nodes: TreeNode[] = [
        { id: 'root1', text: 'Root 1', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root1', order: 0 },
        { id: 'root2', text: 'Root 2', parentId: null, order: 1 },
        { id: 'child2', text: 'Child 2', parentId: 'root2', order: 0 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(2);

      // Find nodes for each tree
      const root1Node = result.nodes.find((n) => n.id === 'root1');
      const root2Node = result.nodes.find((n) => n.id === 'root2');

      expect(root1Node).toBeDefined();
      expect(root2Node).toBeDefined();

      // Second tree should have higher Y position than first tree
      expect(root2Node!.position.y).toBeGreaterThan(root1Node!.position.y);
    });

    // 深くネストされたツリーでLRレイアウト（左右配置）が正しく機能することを確認
    it('should handle deeply nested tree', async () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'level1', text: 'Level 1', parentId: 'root', order: 0 },
        { id: 'level2', text: 'Level 2', parentId: 'level1', order: 0 },
        { id: 'level3', text: 'Level 3', parentId: 'level2', order: 0 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(3);

      // Check that X coordinates increase with depth (LR layout)
      const rootNode = result.nodes.find((n) => n.id === 'root');
      const level1Node = result.nodes.find((n) => n.id === 'level1');
      const level2Node = result.nodes.find((n) => n.id === 'level2');
      const level3Node = result.nodes.find((n) => n.id === 'level3');

      expect(rootNode).toBeDefined();
      expect(level1Node).toBeDefined();
      expect(level2Node).toBeDefined();
      expect(level3Node).toBeDefined();

      expect(level1Node!.position.x).toBeGreaterThan(rootNode!.position.x);
      expect(level2Node!.position.x).toBeGreaterThan(level1Node!.position.x);
      expect(level3Node!.position.x).toBeGreaterThan(level2Node!.position.x);
    });

    // 空のノードリストを正しく処理できることを確認
    it('should handle empty node list', async () => {
      const result = await calculateLayout([]);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    // テキストが空の場合にデフォルトラベル「...」が使用されることを確認
    it('should use default label for empty text', async () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: '', parentId: null, order: 0 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].data.label).toBe('...');
    });

    // ノードのテキストがラベルとして保持されることを確認
    it('should preserve node text as label', async () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Custom Label', parentId: null, order: 0 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].data.label).toBe('Custom Label');
    });

    // 親子ノード間にのみエッジ（線）が作成されることを確認
    it('should create edges only between parent and child', async () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child1', order: 0 },
      ];

      const result = await calculateLayout(nodes);

      expect(result.edges).toHaveLength(3);

      const sources = result.edges.map((e) => e.source);
      const targets = result.edges.map((e) => e.target);

      expect(sources).toContain('root');
      expect(sources).toContain('child1');
      expect(targets).toContain('child1');
      expect(targets).toContain('child2');
      expect(targets).toContain('grandchild');
    });
  });
});
