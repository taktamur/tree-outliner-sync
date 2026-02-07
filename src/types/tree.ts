/**
 * ツリーノードの型定義
 * フラットリスト + parentId 方式でツリー構造を表現
 */
export interface TreeNode {
  /** ノードの一意識別子（UUID） */
  id: string;
  /** ノードのテキスト内容 */
  text: string;
  /** 親ノードのID。ルートノードの場合はnull */
  parentId: string | null;
  /** 兄弟ノード間の表示順序（昇順） */
  order: number;
}
