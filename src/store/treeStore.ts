import { create } from 'zustand';
import type { TreeNode } from '../types/tree';
import { generateId } from '../utils/idGenerator';
import {
  indentNode,
  outdentNode,
  addNodeAfter,
  deleteNode,
  moveNode,
} from '../utils/treeOperations';

interface TreeStore {
  nodes: TreeNode[];
  selectedNodeId: string | null;

  // ノード操作
  updateNodeText: (id: string, text: string) => void;
  indent: (id: string) => void;
  outdent: (id: string) => void;
  addAfter: (afterId: string) => string; // 新ノードのIDを返す
  remove: (id: string) => void;
  move: (nodeId: string, newParentId: string | null) => void;

  // 選択
  setSelectedNodeId: (id: string | null) => void;

  // ストア全体操作
  setNodes: (nodes: TreeNode[]) => void;
}

const createSampleData = (): TreeNode[] => {
  const r1 = generateId();
  const c11 = generateId();
  const c111 = generateId();
  const c12 = generateId();
  const r2 = generateId();
  const c21 = generateId();
  const c22 = generateId();

  return [
    { id: r1, text: 'Root 1', parentId: null, order: 0 },
    { id: c11, text: 'Child 1.1', parentId: r1, order: 0 },
    { id: c111, text: 'Child 1.1.1', parentId: c11, order: 0 },
    { id: c12, text: 'Child 1.2', parentId: r1, order: 1 },
    { id: r2, text: 'Root 2', parentId: null, order: 1 },
    { id: c21, text: 'Child 2.1', parentId: r2, order: 0 },
    { id: c22, text: 'Child 2.2', parentId: r2, order: 1 },
  ];
};

export const useTreeStore = create<TreeStore>((set, get) => ({
  nodes: createSampleData(),
  selectedNodeId: null,

  updateNodeText: (id, text) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, text } : n)),
    }));
  },

  indent: (id) => {
    const result = indentNode(get().nodes, id);
    if (result) set({ nodes: result });
  },

  outdent: (id) => {
    const result = outdentNode(get().nodes, id);
    if (result) set({ nodes: result });
  },

  addAfter: (afterId) => {
    const newId = generateId();
    const newNode: TreeNode = { id: newId, text: '', parentId: null, order: 0 };
    set((state) => ({
      nodes: addNodeAfter(state.nodes, afterId, newNode),
      selectedNodeId: newId,
    }));
    return newId;
  },

  remove: (id) => {
    set((state) => ({
      nodes: deleteNode(state.nodes, id),
    }));
  },

  move: (nodeId, newParentId) => {
    const result = moveNode(get().nodes, nodeId, newParentId);
    if (result) set({ nodes: result });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setNodes: (nodes) => set({ nodes }),
}));
