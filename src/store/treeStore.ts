/**
 * ツリー状態管理ストア
 *
 * Zustandを使用してアプリケーション全体のツリー状態を管理する。
 * OutlinerPanelとTreePanelの両方がこのストアを参照するため、
 * 片方で変更すると自動的にもう片方にも反映される（双方向同期）。
 */
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

/**
 * ツリーストアの型定義
 */
interface TreeStore {
  /** 全ツリーノードのフラットリスト */
  nodes: TreeNode[];
  /** 現在選択されているノードのID（未選択時は null） */
  selectedNodeId: string | null;

  // ノード操作
  /** ノードのテキストを更新 */
  updateNodeText: (id: string, text: string) => void;
  /** ノードをインデント（一つ深い階層に） */
  indent: (id: string) => void;
  /** ノードをアウトデント（一つ浅い階層に） */
  outdent: (id: string) => void;
  /** 指定ノードの直後に新しいノードを追加し、新ノードのIDを返す */
  addAfter: (afterId: string) => string;
  /** ノードを削除（子は一つ上の階層に昇格） */
  remove: (id: string) => void;
  /** ノードを別の親ノードの下に移動（D&D用） */
  move: (nodeId: string, newParentId: string | null) => void;

  // 選択
  /** 選択中のノードIDを設定 */
  setSelectedNodeId: (id: string | null) => void;

  // ストア全体操作
  /** ノードリスト全体を置き換え */
  setNodes: (nodes: TreeNode[]) => void;
}

/**
 * サンプルデータを生成
 *
 * 初期表示用に2つのルートノードと複数の子ノードを持つツリー構造を作成する。
 * @returns サンプルツリーノードの配列
 */
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

/**
 * Zustandストアのインスタンスを作成
 *
 * 状態更新はすべてイミュータブルに行われ、Reactの再レンダリングが自動的にトリガーされる。
 */
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
      selectedNodeId: newId, // 新ノードを自動選択
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
