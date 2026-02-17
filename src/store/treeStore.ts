/**
 * ツリー状態管理ストア
 *
 * Zustandを使用してアプリケーション全体のツリー状態を管理する。
 * OutlinerPanelとTreePanelの両方がこのストアを参照するため、
 * 片方で変更すると自動的にもう片方にも反映される（双方向同期）。
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TreeNode } from './types';
import { ROOT_NODE_ID } from './types';
import { generateId } from '../shared/idGenerator';
import {
  indentNode,
  outdentNode,
  addNodeAfter,
  deleteNode,
  moveNode,
  moveNodeBefore,
  moveNodeAfter,
  moveNodeAsFirstChild,
} from './operations';
import {
  parseScrapboxToTree,
  formatTreeToScrapbox,
} from '../outliner/scrapboxConverter';
import { saveTreeState, loadTreeState, clearTreeState } from '../utils/storage';

/** 履歴の最大保持数 */
const MAX_HISTORY_SIZE = 50;

/**
 * ツリーストアの型定義
 */
interface TreeStore {
  /** 全ツリーノードのフラットリスト */
  nodes: TreeNode[];
  /** 現在選択されているノードのID（未選択時は null） */
  selectedNodeId: string | null;

  // 履歴管理
  /** undo用の過去の状態スタック */
  past: TreeNode[][];
  /** redo用の未来の状態スタック */
  future: TreeNode[][];

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
  move: (nodeId: string, newParentId: string | null, insertOrder?: number) => void;
  /** ノードを指定ノードの直前に兄弟として挿入 */
  moveBefore: (nodeId: string, targetNodeId: string) => void;
  /** ノードを指定ノードの直後に兄弟として挿入 */
  moveAfter: (nodeId: string, targetNodeId: string) => void;
  /** ノードを指定ノードの子の先頭に挿入 */
  moveAsFirstChild: (nodeId: string, targetNodeId: string) => void;

  // undo/redo
  /** 操作を取り消す */
  undo: () => void;
  /** 取り消した操作をやり直す */
  redo: () => void;
  /** undoが可能かどうか */
  canUndo: () => boolean;
  /** redoが可能かどうか */
  canRedo: () => boolean;

  // 選択
  /** 選択中のノードIDを設定 */
  setSelectedNodeId: (id: string | null) => void;

  // ストア全体操作
  /** ノードリスト全体を置き換え */
  setNodes: (nodes: TreeNode[]) => void;

  // Scrapbox連携
  /** Scrapboxテキストからインポート（既存データは置き換えられる） */
  importFromScrapbox: (text: string) => void;
  /** Scrapboxテキストにエクスポート */
  exportToScrapbox: () => string;
}

/**
 * サンプルデータを生成
 *
 * 初期表示用に隠しルートノードと2つのトップレベルノード、複数の子ノードを持つツリー構造を作成する。
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
    { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 },
    { id: r1, text: 'Root 1', parentId: ROOT_NODE_ID, order: 0 },
    { id: c11, text: 'Child 1.1', parentId: r1, order: 0 },
    { id: c111, text: 'Child 1.1.1', parentId: c11, order: 0 },
    { id: c12, text: 'Child 1.2', parentId: r1, order: 1 },
    { id: r2, text: 'Root 2', parentId: ROOT_NODE_ID, order: 1 },
    { id: c21, text: 'Child 2.1', parentId: r2, order: 0 },
    { id: c22, text: 'Child 2.2', parentId: r2, order: 1 },
  ];
};

/**
 * 初期データを取得
 * localStorageに保存されたデータがあればそれを使用し、なければサンプルデータを使用する。
 * localStorage互換性は不要。読み込み失敗時はデフォルトデータを使用。
 * @returns ツリーノードの配列
 */
const getInitialData = (): TreeNode[] => {
  const saved = loadTreeState();
  if (saved && saved.length > 0) {
    // 隠しルートノードが存在するかチェック
    const hasRootNode = saved.some((node) => node.id === ROOT_NODE_ID);
    if (hasRootNode) {
      return saved;
    }
  }
  // 隠しルートがない場合はサンプルデータにフォールバック
  return createSampleData();
};

/**
 * Zustandストアのインスタンスを作成
 *
 * 状態更新はすべてイミュータブルに行われ、Reactの再レンダリングが自動的にトリガーされる。
 */
export const useTreeStore = create<TreeStore>()(
  subscribeWithSelector((set, get) => ({
    nodes: getInitialData(),
    selectedNodeId: null,
    past: [],
    future: [],

  updateNodeText: (id, text) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, text } : n)),
      // updateNodeTextは履歴管理から除外（タイピング中の各文字を記録しないため）
    }));
  },

  indent: (id) => {
    const result = indentNode(get().nodes, id);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [], // 新しい操作をしたらredoスタックをクリア
      }));
    }
  },

  outdent: (id) => {
    const result = outdentNode(get().nodes, id);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [],
      }));
    }
  },

  addAfter: (afterId) => {
    const newId = generateId();
    const newNode: TreeNode = { id: newId, text: '', parentId: null, order: 0 };
    set((state) => ({
      nodes: addNodeAfter(state.nodes, afterId, newNode),
      selectedNodeId: newId, // 新ノードを自動選択
      past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
      future: [],
    }));
    return newId;
  },

  remove: (id) => {
    // 隠しルートノードの削除を防止
    if (id === ROOT_NODE_ID) return;
    set((state) => ({
      nodes: deleteNode(state.nodes, id),
      past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
      future: [],
    }));
  },

  move: (nodeId, newParentId, insertOrder) => {
    const result = moveNode(get().nodes, nodeId, newParentId, insertOrder);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [],
      }));
    }
  },

  moveBefore: (nodeId, targetNodeId) => {
    const result = moveNodeBefore(get().nodes, nodeId, targetNodeId);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [],
      }));
    }
  },

  moveAfter: (nodeId, targetNodeId) => {
    const result = moveNodeAfter(get().nodes, nodeId, targetNodeId);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [],
      }));
    }
  },

  moveAsFirstChild: (nodeId, targetNodeId) => {
    const result = moveNodeAsFirstChild(get().nodes, nodeId, targetNodeId);
    if (result) {
      set((state) => ({
        nodes: result,
        past: [...state.past, state.nodes].slice(-MAX_HISTORY_SIZE),
        future: [],
      }));
    }
  },

  undo: () => {
    const { past, nodes } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      nodes: previous,
      future: [nodes, ...get().future].slice(0, MAX_HISTORY_SIZE),
    });
  },

  redo: () => {
    const { future, nodes } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...get().past, nodes].slice(-MAX_HISTORY_SIZE),
      nodes: next,
      future: newFuture,
    });
  },

  canUndo: () => get().past.length > 0,

  canRedo: () => get().future.length > 0,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setNodes: (nodes) => set({ nodes }),

  importFromScrapbox: (text) => {
    const nodes = parseScrapboxToTree(text);
    // Scrapboxインポート時はlocalStorageをクリア
    clearTreeState();
    set({ nodes, selectedNodeId: null });
  },

  exportToScrapbox: () => {
    return formatTreeToScrapbox(get().nodes);
  },
})));

// ツリーノードの変更を監視して自動保存
useTreeStore.subscribe(
  (state) => state.nodes,
  (nodes) => {
    saveTreeState(nodes);
  },
  {
    // ノード配列が実際に変更された場合のみ保存
    equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  }
);
