import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTreeLayout } from './useTreeLayout';
import { useTreeStore } from '../store/treeStore';
import type { TreeNode } from '../types/tree';

describe('useTreeLayout', () => {
  beforeEach(() => {
    // 各テストの前にストアをリセット
    const { setNodes, setSelectedNodeId } = useTreeStore.getState();
    setNodes([]);
    setSelectedNodeId(null);
  });

  it('空のノードリストでも正常に動作する', () => {
    const { setNodes } = useTreeStore.getState();
    setNodes([]);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
  });

  it('単一ルートノードのレイアウトを計算できる', () => {
    const testNodes: TreeNode[] = [
      { id: 'root', text: 'Root', parentId: null, order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes.length).toBe(1);
    expect(result.current.nodes[0].id).toBe('root');
    expect(result.current.nodes[0].position).toBeDefined();
    expect(result.current.edges.length).toBe(0);
  });

  it('親子関係のノードでエッジが生成される', () => {
    const testNodes: TreeNode[] = [
      { id: 'parent', text: 'Parent', parentId: null, order: 0 },
      { id: 'child', text: 'Child', parentId: 'parent', order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes.length).toBe(2);
    expect(result.current.edges.length).toBe(1);
    expect(result.current.edges[0].source).toBe('parent');
    expect(result.current.edges[0].target).toBe('child');
  });

  it('複数ルートノードを扱える', () => {
    const testNodes: TreeNode[] = [
      { id: 'root1', text: 'Root1', parentId: null, order: 0 },
      { id: 'root2', text: 'Root2', parentId: null, order: 1 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes.length).toBe(2);
    const root1 = result.current.nodes.find((n) => n.id === 'root1');
    const root2 = result.current.nodes.find((n) => n.id === 'root2');

    expect(root1).toBeDefined();
    expect(root2).toBeDefined();
    // 複数ルートは縦に配置されるため、Y座標が異なる
    expect(root1!.position.y).not.toBe(root2!.position.y);
  });

  it('深くネストされた構造を扱える', () => {
    const testNodes: TreeNode[] = [
      { id: 'level0', text: 'Level0', parentId: null, order: 0 },
      { id: 'level1', text: 'Level1', parentId: 'level0', order: 0 },
      { id: 'level2', text: 'Level2', parentId: 'level1', order: 0 },
      { id: 'level3', text: 'Level3', parentId: 'level2', order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes.length).toBe(4);
    expect(result.current.edges.length).toBe(3);

    // LR（Left-to-Right）レイアウトなので、深さに応じてX座標が増加する
    const level0 = result.current.nodes.find((n) => n.id === 'level0')!;
    const level1 = result.current.nodes.find((n) => n.id === 'level1')!;
    const level2 = result.current.nodes.find((n) => n.id === 'level2')!;
    const level3 = result.current.nodes.find((n) => n.id === 'level3')!;

    expect(level1.position.x).toBeGreaterThan(level0.position.x);
    expect(level2.position.x).toBeGreaterThan(level1.position.x);
    expect(level3.position.x).toBeGreaterThan(level2.position.x);
  });

  it('選択中のノードがdataに反映される', () => {
    const testNodes: TreeNode[] = [
      { id: 'node1', text: 'Node1', parentId: null, order: 0 },
      { id: 'node2', text: 'Node2', parentId: null, order: 1 },
    ];
    const { setNodes, setSelectedNodeId } = useTreeStore.getState();
    setNodes(testNodes);
    setSelectedNodeId('node1');

    const { result } = renderHook(() => useTreeLayout());

    const node1 = result.current.nodes.find((n) => n.id === 'node1');
    const node2 = result.current.nodes.find((n) => n.id === 'node2');

    expect(node1?.data.selected).toBe(true);
    expect(node2?.data.selected).toBe(false);
  });

  it('ノードタイプがcustomに設定される', () => {
    const testNodes: TreeNode[] = [
      { id: 'node1', text: 'Node1', parentId: null, order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes[0].type).toBe('custom');
  });

  it('エッジタイプがsmoothstepに設定される', () => {
    const testNodes: TreeNode[] = [
      { id: 'parent', text: 'Parent', parentId: null, order: 0 },
      { id: 'child', text: 'Child', parentId: 'parent', order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.edges[0].type).toBe('smoothstep');
    expect(result.current.edges[0].style).toBeDefined();
  });

  it('ノードデータにテキストが含まれる', () => {
    const testNodes: TreeNode[] = [
      { id: 'node1', text: 'Test Text', parentId: null, order: 0 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes[0].data.text).toBe('Test Text');
  });

  it('複数の子を持つノードを扱える', () => {
    const testNodes: TreeNode[] = [
      { id: 'parent', text: 'Parent', parentId: null, order: 0 },
      { id: 'child1', text: 'Child1', parentId: 'parent', order: 0 },
      { id: 'child2', text: 'Child2', parentId: 'parent', order: 1 },
      { id: 'child3', text: 'Child3', parentId: 'parent', order: 2 },
    ];
    const { setNodes } = useTreeStore.getState();
    setNodes(testNodes);

    const { result } = renderHook(() => useTreeLayout());

    expect(result.current.nodes.length).toBe(4);
    expect(result.current.edges.length).toBe(3);

    // すべての子がparentをsourceとするエッジを持つ
    const parentEdges = result.current.edges.filter((e) => e.source === 'parent');
    expect(parentEdges.length).toBe(3);
  });
});
