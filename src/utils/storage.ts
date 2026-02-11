/**
 * localStorage操作のユーティリティ関数
 *
 * ツリーノードの永続化を担当する。
 * 自動保存・自動読み込みをサポートする。
 */
import type { TreeNode } from '../store/types';

const STORAGE_KEY = 'tree-outliner-sync:nodes';

/**
 * ツリーノードをlocalStorageに保存
 * @param nodes - 保存するTreeNode配列
 */
export const saveTreeState = (nodes: TreeNode[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch (error) {
    console.error('Failed to save tree state:', error);
  }
};

/**
 * localStorageからツリーノードを読み込み
 * @returns 保存されていたTreeNode配列、存在しない場合はnull
 */
export const loadTreeState = (): TreeNode[] | null => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to load tree state:', error);
    return null;
  }
};

/**
 * localStorageに保存されたツリーノードをクリア
 */
export const clearTreeState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tree state:', error);
  }
};
