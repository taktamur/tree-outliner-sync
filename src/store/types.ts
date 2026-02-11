/**
 * ツリーノードの型定義
 *
 * フラットリスト + parentId 方式でツリー構造を表現する。
 * ネスト構造は描画時に動的に計算して導出する。
 */
export interface TreeNode {
  /** ノードの一意識別子（UUID） */
  id: string;
  /** ノードに表示するテキスト内容 */
  text: string;
  /** 親ノードのID。ルートノードの場合は null */
  parentId: string | null;
  /** 同じ親を持つ兄弟ノード間での表示順序（昇順） */
  order: number;
}
