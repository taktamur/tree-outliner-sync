import { describe, it, expect } from 'vitest';
import type { TreeNode } from './types';
import { ROOT_NODE_ID } from './types';
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
  moveNodeBefore,
  moveNodeAfter,
  moveNodeAsFirstChild,
} from './operations';

describe('treeOperations', () => {
  describe('getChildren', () => {
    // 親ノードの子ノードをorder順にソートして取得するテスト
    it('should return children of a parent sorted by order', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
      ];
      const children = getChildren(nodes, 'root');
      expect(children).toHaveLength(2);
      expect(children[0].id).toBe('child1');
      expect(children[1].id).toBe('child2');
    });

    // parentIdがROOT_NODE_IDの場合にルートノードを取得することを確認
    it('should return root nodes when parentId is ROOT_NODE_ID', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root1', text: 'Root 1', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'root2', text: 'Root 2', parentId: ROOT_NODE_ID, order: 1 },
        { id: 'child', text: 'Child', parentId: 'root1', order: 0 },
      ];
      const roots = getChildren(nodes, ROOT_NODE_ID);
      expect(roots).toHaveLength(2);
      expect(roots[0].id).toBe('root1');
      expect(roots[1].id).toBe('root2');
    });

    // 子ノードが存在しない場合に空配列を返すことを確認
    it('should return empty array if no children exist', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const children = getChildren(nodes, 'root');
      expect(children).toHaveLength(0);
    });
  });

  describe('getDescendantIds', () => {
    // すべての子孫ノードのIDを再帰的に取得するテスト
    it('should return all descendant IDs recursively', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
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

    // リーフノード（子を持たないノード）の場合に空配列を返すことを確認
    it('should return empty array for leaf nodes', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'leaf', text: 'Leaf', parentId: 'root', order: 0 },
      ];
      const descendants = getDescendantIds(nodes, 'leaf');
      expect(descendants).toHaveLength(0);
    });
  });

  describe('getFlattenedOrder', () => {
    // ノードを深さ優先探索（DFS）順で返すテスト
    it('should return nodes in DFS order', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root1', text: 'Root 1', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1-1', text: 'Child 1.1', parentId: 'root1', order: 0 },
        { id: 'child1-2', text: 'Child 1.2', parentId: 'root1', order: 1 },
        { id: 'root2', text: 'Root 2', parentId: ROOT_NODE_ID, order: 1 },
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

    // 空のリストを正しく処理できることを確認
    it('should handle empty list', () => {
      const flattened = getFlattenedOrder([]);
      expect(flattened).toHaveLength(0);
    });
  });

  describe('getDepth', () => {
    // ネストされたノードの正しい深さを返すテスト
    it('should return correct depth for nested nodes', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      expect(getDepth(nodes, 'root')).toBe(0);
      expect(getDepth(nodes, 'child')).toBe(1);
      expect(getDepth(nodes, 'grandchild')).toBe(2);
    });

    // 存在しないノードに対して0を返すことを確認
    it('should return 0 for non-existent node', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      expect(getDepth(nodes, 'nonexistent')).toBe(0);
    });
  });

  describe('indentNode', () => {
    // ノードをインデントして直前の兄弟ノードの子にするテスト
    it('should indent node to become child of previous sibling', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const result = indentNode(nodes, 'child2');
      expect(result).not.toBeNull();
      const child2 = result!.find((n) => n.id === 'child2');
      expect(child2?.parentId).toBe('child1');
    });

    // ノードが最初の兄弟の場合にnullを返すことを確認
    it('should return null if node is first sibling', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const result = indentNode(nodes, 'child1');
      expect(result).toBeNull();
    });

    // ノードが存在しない場合にnullを返すことを確認
    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = indentNode(nodes, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('outdentNode', () => {
    // ノードをアウトデントして親の兄弟にするテスト
    it('should outdent node to become sibling of parent', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      const result = outdentNode(nodes, 'grandchild');
      expect(result).not.toBeNull();
      const grandchild = result!.find((n) => n.id === 'grandchild');
      expect(grandchild?.parentId).toBe('root');
    });

    // ノードがルートの場合にnullを返すことを確認
    it('should return null if node is root', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = outdentNode(nodes, 'root');
      expect(result).toBeNull();
    });

    // ノードが存在しない場合にnullを返すことを確認
    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = outdentNode(nodes, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('normalizeOrders', () => {
    // 兄弟ノードのorder値を0,1,2...に正規化するテスト
    it('should normalize sibling orders to 0,1,2...', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
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

    // 兄弟でないノードには影響しないことを確認
    it('should not affect non-sibling nodes', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 1.5 },
        { id: 'other', text: 'Other', parentId: 'different', order: 3.7 },
      ];
      const result = normalizeOrders(nodes, 'root');
      const other = result.find((n) => n.id === 'other');
      expect(other?.order).toBe(3.7);
    });
  });

  describe('addNodeAfter', () => {
    // 指定したノードの後ろに新しいノードを兄弟として追加するテスト
    it('should add new node after specified node as sibling', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
      ];
      const newNode: TreeNode = { id: 'new', text: 'New', parentId: ROOT_NODE_ID, order: 0 };
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

    // 指定したノードが存在しない場合でもノードを追加できることを確認
    it('should add node even if afterNode does not exist', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const newNode: TreeNode = { id: 'new', text: 'New', parentId: ROOT_NODE_ID, order: 0 };
      const result = addNodeAfter(nodes, 'nonexistent', newNode);
      expect(result).toHaveLength(3);
      expect(result.find((n) => n.id === 'new')).toBeDefined();
    });
  });

  describe('deleteNode', () => {
    // ノードを削除し、その子ノードを親の階層に昇格させるテスト
    it('should delete node and promote children', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
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

    // ノードが存在しない場合に配列を変更せず返すことを確認
    it('should return unchanged array if node does not exist', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = deleteNode(nodes, 'nonexistent');
      expect(result).toEqual(nodes);
    });
  });

  describe('moveNode', () => {
    // ノードを新しい親ノードに移動するテスト
    it('should move node to new parent', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root1', text: 'Root 1', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'root2', text: 'Root 2', parentId: ROOT_NODE_ID, order: 1 },
        { id: 'child', text: 'Child', parentId: 'root1', order: 0 },
      ];
      const result = moveNode(nodes, 'child', 'root2');
      expect(result).not.toBeNull();
      const child = result!.find((n) => n.id === 'child');
      expect(child?.parentId).toBe('root2');
    });

    // 循環参照を防ぐことを確認（ノードを自分の子孫に移動できない）
    it('should prevent circular reference', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child', order: 0 },
      ];
      const result = moveNode(nodes, 'root', 'grandchild');
      expect(result).toBeNull();
    });

    // ノードを自分自身に移動しようとした場合にnullを返すことを確認
    it('should return null if moving node to itself', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = moveNode(nodes, 'root', 'root');
      expect(result).toBeNull();
    });

    // ノードをルートレベルに移動できることを確認（親をROOT_NODE_IDにする）
    it('should allow moving to root (ROOT_NODE_ID parent)', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
      ];
      const result = moveNode(nodes, 'child', ROOT_NODE_ID);
      expect(result).not.toBeNull();
      const child = result!.find((n) => n.id === 'child');
      expect(child?.parentId).toBe(ROOT_NODE_ID);
    });
  });

  describe('moveNodeBefore', () => {
    it('should move node before target node as sibling', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'child3', text: 'Child 3', parentId: 'root', order: 2 },
      ];

      // child3をchild2の直前に移動
      const result = moveNodeBefore(nodes, 'child3', 'child2');
      expect(result).not.toBeNull();

      const children = getChildren(result!, 'root');
      expect(children[0].id).toBe('child1');
      expect(children[1].id).toBe('child3'); // child2の直前
      expect(children[2].id).toBe('child2');
    });

    it('should return null if target node not found', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = moveNodeBefore(nodes, 'root', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('moveNodeAfter', () => {
    it('should move node after target node as sibling', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'child3', text: 'Child 3', parentId: 'root', order: 2 },
      ];

      // child1をchild2の直後に移動
      const result = moveNodeAfter(nodes, 'child1', 'child2');
      expect(result).not.toBeNull();

      const children = getChildren(result!, 'root');
      expect(children[0].id).toBe('child2');
      expect(children[1].id).toBe('child1'); // child2の直後
      expect(children[2].id).toBe('child3');
    });

    it('should return null if target node not found', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
      ];
      const result = moveNodeAfter(nodes, 'root', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('moveNodeAsFirstChild', () => {
    it('should move node as first child of target node', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child1', text: 'Child 1', parentId: 'root', order: 0 },
        { id: 'child2', text: 'Child 2', parentId: 'root', order: 1 },
        { id: 'grandchild', text: 'Grandchild', parentId: 'child1', order: 0 },
      ];

      // child2をchild1の子の先頭に移動
      const result = moveNodeAsFirstChild(nodes, 'child2', 'child1');
      expect(result).not.toBeNull();

      const children = getChildren(result!, 'child1');
      expect(children[0].id).toBe('child2'); // 先頭
      expect(children[1].id).toBe('grandchild');
    });

    it('should prevent circular reference', () => {
      const nodes: TreeNode[] = [
        { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
        { id: 'root', text: 'Root', parentId: ROOT_NODE_ID, order: 0 },
        { id: 'child', text: 'Child', parentId: 'root', order: 0 },
      ];

      // rootをchildの子にしようとする（循環参照）
      const result = moveNodeAsFirstChild(nodes, 'root', 'child');
      expect(result).toBeNull();
    });
  });
});
