import { describe, it, expect } from 'vitest'
import type { TreeNode } from '../types/tree'
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
} from './treeOperations'

describe('treeOperations', () => {
  const createNode = (id: string, parentId: string | null, order: number): TreeNode => ({
    id,
    label: `Node ${id}`,
    parentId,
    order,
  })

  describe('getChildren', () => {
    it('should return children of a parent in order', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 1),
        createNode('3', '1', 0),
      ]
      const children = getChildren(nodes, '1')
      expect(children).toHaveLength(2)
      expect(children[0].id).toBe('3')
      expect(children[1].id).toBe('2')
    })

    it('should return empty array for node with no children', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(getChildren(nodes, '1')).toEqual([])
    })

    it('should return root nodes when parentId is null', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 1),
        createNode('3', '1', 0),
      ]
      const roots = getChildren(nodes, null)
      expect(roots).toHaveLength(2)
      expect(roots[0].id).toBe('1')
      expect(roots[1].id).toBe('2')
    })
  })

  describe('getDescendantIds', () => {
    it('should return all descendant IDs recursively', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
        createNode('3', '1', 1),
        createNode('4', '2', 0),
      ]
      const descendants = getDescendantIds(nodes, '1')
      expect(descendants).toEqual(['2', '4', '3'])
    })

    it('should return empty array for leaf node', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(getDescendantIds(nodes, '1')).toEqual([])
    })
  })

  describe('getFlattenedOrder', () => {
    it('should flatten tree in DFS order', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
        createNode('3', '1', 1),
        createNode('4', '2', 0),
      ]
      const flattened = getFlattenedOrder(nodes)
      expect(flattened.map((n) => n.id)).toEqual(['1', '2', '4', '3'])
    })
  })

  describe('getDepth', () => {
    it('should return 0 for root node', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(getDepth(nodes, '1')).toBe(0)
    })

    it('should return correct depth for nested node', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
        createNode('3', '2', 0),
      ]
      expect(getDepth(nodes, '3')).toBe(2)
    })
  })

  describe('indentNode', () => {
    it('should indent node by making it child of previous sibling', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 1),
      ]
      const result = indentNode(nodes, '2')
      expect(result).not.toBeNull()
      const node2 = result!.find((n) => n.id === '2')
      expect(node2?.parentId).toBe('1')
    })

    it('should return null if node is first sibling', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 1),
      ]
      expect(indentNode(nodes, '1')).toBeNull()
    })

    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(indentNode(nodes, 'nonexistent')).toBeNull()
    })
  })

  describe('outdentNode', () => {
    it('should outdent node by making it sibling of parent', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
      ]
      const result = outdentNode(nodes, '2')
      expect(result).not.toBeNull()
      const node2 = result!.find((n) => n.id === '2')
      expect(node2?.parentId).toBeNull()
    })

    it('should return null if node is already root', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(outdentNode(nodes, '1')).toBeNull()
    })

    it('should return null if node does not exist', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(outdentNode(nodes, 'nonexistent')).toBeNull()
    })
  })

  describe('normalizeOrders', () => {
    it('should normalize orders to 0, 1, 2...', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 5),
        createNode('3', null, 3),
      ]
      const normalized = normalizeOrders(nodes, null)
      const roots = normalized.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order)
      expect(roots[0].order).toBe(0)
      expect(roots[1].order).toBe(1)
      expect(roots[2].order).toBe(2)
    })
  })

  describe('addNodeAfter', () => {
    it('should add node after specified node at same level', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 1),
      ]
      const newNode = createNode('3', null, 0)
      const result = addNodeAfter(nodes, '1', newNode)
      const node3 = result.find((n) => n.id === '3')
      expect(node3?.parentId).toBeNull()
      expect(result.filter((n) => n.parentId === null)).toHaveLength(3)
    })

    it('should add node to empty list if afterNodeId does not exist', () => {
      const nodes: TreeNode[] = []
      const newNode = createNode('1', null, 0)
      const result = addNodeAfter(nodes, 'nonexistent', newNode)
      expect(result).toHaveLength(1)
    })
  })

  describe('deleteNode', () => {
    it('should delete node and promote children to same level', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
        createNode('3', '1', 1),
      ]
      const result = deleteNode(nodes, '1')
      expect(result.find((n) => n.id === '1')).toBeUndefined()
      expect(result.find((n) => n.id === '2')?.parentId).toBeNull()
      expect(result.find((n) => n.id === '3')?.parentId).toBeNull()
    })

    it('should return unchanged nodes if node does not exist', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      const result = deleteNode(nodes, 'nonexistent')
      expect(result).toEqual(nodes)
    })
  })

  describe('moveNode', () => {
    it('should move node to new parent', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', null, 1),
        createNode('3', '1', 0),
      ]
      const result = moveNode(nodes, '3', '2')
      expect(result).not.toBeNull()
      const node3 = result!.find((n) => n.id === '3')
      expect(node3?.parentId).toBe('2')
    })

    it('should return null if moving node to itself', () => {
      const nodes: TreeNode[] = [createNode('1', null, 0)]
      expect(moveNode(nodes, '1', '1')).toBeNull()
    })

    it('should return null if creating circular reference', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
      ]
      expect(moveNode(nodes, '1', '2')).toBeNull()
    })

    it('should allow moving to root (null parent)', () => {
      const nodes: TreeNode[] = [
        createNode('1', null, 0),
        createNode('2', '1', 0),
      ]
      const result = moveNode(nodes, '2', null)
      expect(result).not.toBeNull()
      const node2 = result!.find((n) => n.id === '2')
      expect(node2?.parentId).toBeNull()
    })
  })
})
