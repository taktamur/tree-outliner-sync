import { describe, it, expect } from 'vitest';
import type { TreeNode } from '../types/tree';
import {
  getChildren,
  getDescendantIds,
  getFlattenedOrder,
  getDepth,
  indentNode,
  outdentNode,
  normalizeOrders,
  addNodeAfter,
  deleteNode,
  moveNode,
} from './treeOperations';

describe('treeOperations', () => {
  describe('getChildren', () => {
    it('should return children of a parent sorted by order', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
      ];
      const children = getChildren(nodes, 'root');
      expect(children).toHaveLength(2);
      expect(children[0].id).toBe('child1');
      expect(children[1].id).toBe('child2');
    });

    it('should return root nodes when parentId is null', () => {
      const nodes: TreeNode[] = [
        { id: 'root1', text: 'Root 1', parentId: null, order: 0 },
        { id: 'root2', text: 'Root 2', parentId: null, order: 1 },
        { id: 'child', text: 'Child', parentId: 'root1', order: 0 },
      ];
      const roots = getChildren(nodes, null);
      expect(roots).toHaveLength(2);
      expect(roots[0].id).toBe('root1');
      expect(roots[1].id).toBe('root2');
    });

    it('should return empty array if no children exist', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const children = getChildren(nodes, 'root');
      expect(children).toHaveLength(0);
    });
  });

  describe('getDescendantIds', () => {
    it('should return all descendant IDs recursively', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child1', order: 0 },
      ];
      const descendants = getDescendantIds(nodes, 'root');
      expect(descendants).toHaveLength(3);
      expect(descendants).toContain('child1');
      expect(descendants).toContain('child2');
      expect(descendants).toContain('grandchild');
    });

    it('should return empty array for leaf nodes', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'leaf', text: 'Leaf', parentId: 'root', order: 0 },
      ];
      const descendants = getDescendantIds(nodes, 'leaf');
      expect(descendants).toHaveLength(0);
    });
  });

  describe('getFlattenedOrder', () => {
    it('should return nodes in DFS order', () => {
      const nodes: TreeNode[] = [
        { id: 'root1', text: 'Root 1', parentId: null, order: 0 },
        { id: 'child1-1', text: 'Child 1.1', parentId: 'root1', order: 0 },
        { id: 'child1-2', text: 'Child 1.2', parentId: 'root1', order: 1 },
        { id: 'root2', text: 'Root 2', parentId: null, order: 1 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child1-1', order: 0 },
      ];
      const flattened = getFlattenedOrder(nodes);
      expect(flattened.map((n) => n.id)).toEqual([
        'root1',
        'child1-1',
        'grandchild',
        'child1-2',
        'root2',
      ]);
    });

    it('should handle empty list', () => {
      const flattened = getFlattenedOrder([]);
      expect(flattened).toHaveLength(0);
    });
  });

  describe('getDepth', () => {
    it('should return correct depth for nested nodes', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      expect(getDepth(nodes, 'root')).toBe(0);
      expect(getDepth(nodes, 'child')).toBe(1);
      expect(getDepth(nodes, 'grandchild')).toBe(2);
    });

    it('should return 0 for non-existent node', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      expect(getDepth(nodes, 'nonexistent')).toBe(0);
    });
  });

  describe('indentNode', () => {
    it('should indent node to become child of previous sibling', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const result = indentNode(nodes, 'child2');
      expect(result).not.toBeNull();
      const child2 = result!.find((n) => n.id === 'child2');
      expect(child2?.parentId).toBe('child1');
    });

    it('should return null if node is first sibling', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const result = indentNode(nodes, 'child1');
      expect(result).toBeNull();
    });

    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const result = indentNode(nodes, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('outdentNode', () => {
    it('should outdent node to become sibling of parent', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      const result = outdentNode(nodes, 'grandchild');
      expect(result).not.toBeNull();
      const grandchild = result!.find((n) => n.id === 'grandchild');
      expect(grandchild?.parentId).toBe(null);
    });

    it('should return null if node is root', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const result = outdentNode(nodes, 'root');
      expect(result).toBeNull();
    });

    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const result = outdentNode(nodes, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('normalizeOrders', () => {
    it('should normalize sibling orders to 0,1,2...', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0.5 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 2.7 },
        { id: 'child3', text: 'Child 3', parentId: 'root', order: 1.2 },
      ];
      const result = normalizeOrders(nodes, 'root');
      const children = result.filter((n) => n.parentId === 'root').sort((a, b) => a.order - b.order);
      expect(children[0].order).toBe(0);
      expect(children[1].order).toBe(1);
      expect(children[2].order).toBe(2);
    });

    it('should not affect non-sibling nodes', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 1.5 },
        { id: 'other', text: 'Other', parentId: 'different', order: 3.7 },
      ];
      const result = normalizeOrders(nodes, 'root');
      const other = result.find((n) => n.id === 'other');
      expect(other?.order).toBe(3.7);
    });
  });

  describe('addNodeAfter', () => {
    it('should add new node after specified node as sibling', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const newNode: TreeNode = { id: 'new', text: 'New', parentId: null, order: 0 };
      const result = addNodeAfter(nodes, 'child1', newNode);

      const addedNode = result.find((n) => n.id === 'new');
      expect(addedNode).toBeDefined();
      expect(addedNode?.parentId).toBe('root');

      const siblings = result
        .filter((n) => n.parentId === 'root')
        .sort((a, b) => a.order - b.order);
      expect(siblings[0].id).toBe('child1');
      expect(siblings[1].id).toBe('new');
      expect(siblings[2].id).toBe('child2');
    });

    it('should add node even if afterNode does not exist', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const newNode: TreeNode = { id: 'new', text: 'New', parentId: null, order: 0 };
      const result = addNodeAfter(nodes, 'nonexistent', newNode);
      expect(result).toHaveLength(2);
      expect(result.find((n) => n.id === 'new')).toBeDefined();
    });
  });

  describe('deleteNode', () => {
    it('should delete node and promote children', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild1', text: 'Grandchild 1', parentId: 'child', order: 0 },
        { id: 'grandchild2', text: 'Grandchild 2', parentId: 'child', order: 1 },
      ];
      const result = deleteNode(nodes, 'child');

      expect(result.find((n) => n.id === 'child')).toBeUndefined();

      const grandchild1 = result.find((n) => n.id === 'grandchild1');
      const grandchild2 = result.find((n) => n.id === 'grandchild2');
      expect(grandchild1?.parentId).toBe('root');
      expect(grandchild2?.parentId).toBe('root');
    });

    it('should return unchanged array if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const result = deleteNode(nodes, 'nonexistent');
      expect(result).toEqual(nodes);
    });
  });

  describe('moveNode', () => {
    it('should move node to new parent', () => {
      const nodes: TreeNode[] = [
        { id: 'root1', text: 'Root 1', parentId: null, order: 0 },
        { id: 'root2', text: 'Root 2', parentId: null, order: 1 },
        { id: 'child', text: 'Child', parentId: 'root1', order: 0 },
      ];
      const result = moveNode(nodes, 'child', 'root2');
      expect(result).not.toBeNull();
      const child = result!.find((n) => n.id === 'child');
      expect(child?.parentId).toBe('root2');
    });

    it('should prevent circular reference', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      const result = moveNode(nodes, 'root', 'grandchild');
      expect(result).toBeNull();
    });

    it('should return null if moving node to itself', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
      ];
      const result = moveNode(nodes, 'root', 'root');
      expect(result).toBeNull();
    });

    it('should allow moving to root (null parent)', () => {
      const nodes: TreeNode[] = [
        { id: 'root', text: 'Root', parentId: null, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
      ];
      const result = moveNode(nodes, 'child', null);
      expect(result).not.toBeNull();
      const child = result!.find((n) => n.id === 'child');
      expect(child?.parentId).toBeNull();
    });
  });
});
