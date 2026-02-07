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
 * Zustandを使った状態管理
 */
interface TreeStore {
  /** 全ノードのフラットリスト */
  nodes: TreeNode[];
  /** 現在選択されているノードのID（未選択時はnull） */
  selectedNodeId: string | null;

  // ノード操作系メソッド
  /** ノードのテキストを更新 */
  updateNodeText: (id: string, text: string) => void;
  /** ノードをインデント（一つ深い階層へ） */
  indent: (id: string) => void;
  /** ノードをアウトデント（一つ浅い階層へ） */
  outdent: (id: string) => void;
  /** 指定ノードの直後に新しいノードを追加（新ノードのIDを返す） */
  addAfter: (afterId: string) => string;
  /** ノードを削除（子ノードは昇格） */
  remove: (id: string) => void;
  /** ノードを別の親に移動（D&D用） */
  move: (nodeId: string, newParentId: string | null) => void;

  // 選択状態管理
  /** 選択中のノードIDをセット */
  setSelectedNodeId: (id: string | null) => void;

  // ストア全体操作
  /** ノードリスト全体を置き換え（インポートなどで使用） */
  setNodes: (nodes: TreeNode[]) => void;
}

/**
 * サンプルデータを作成
 * 2つのルートノードと複数の子ノードを持つツリー構造
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
 * ツリーストアの作成
 * Zustandを使用してグローバルな状態管理を行う
 */
export const useTreeStore = create<TreeStore>((set, get) => ({
  nodes: createSampleData(),
  selectedNodeId: null,

  // ノードのテキスト更新: 該当IDのノードだけを更新
  updateNodeText: (id, text) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, text } : n)),
    }));
  },

  // インデント: utils関数を呼び出し、結果があれば反映
  indent: (id) => {
    const result = indentNode(get().nodes, id);
    if (result) set({ nodes: result });
  },

  // アウトデント: utils関数を呼び出し、結果があれば反映
  outdent: (id) => {
    const result = outdentNode(get().nodes, id);
    if (result) set({ nodes: result });
  },

  // ノード追加: 新IDを生成し、指定ノードの後に挿入、自動的に選択状態にする
  addAfter: (afterId) => {
    const newId = generateId();
    const newNode: TreeNode = { id: newId, text: '', parentId: null, order: 0 };
    set((state) => ({
      nodes: addNodeAfter(state.nodes, afterId, newNode),
      selectedNodeId: newId, // 追加したノードを自動選択
    }));
    return newId;
  },

  // ノード削除: 子ノードは自動的に昇格
  remove: (id) => {
    set((state) => ({
      nodes: deleteNode(state.nodes, id),
    }));
  },

  // ノード移動: D&Dなどで使用、循環参照チェック済み
  move: (nodeId, newParentId) => {
    const result = moveNode(get().nodes, nodeId, newParentId);
    if (result) set({ nodes: result });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setNodes: (nodes) => set({ nodes }),
}));
