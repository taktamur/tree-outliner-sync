/**
 * Scrapbox形式のテキストとTreeNode配列の双方向変換ユーティリティ
 *
 * Scrapboxはインデントベースのアウトライナーで、階層構造をスペースまたはタブで表現する。
 * 1階層につき1文字のインデント（スペースまたはタブ）を使用する。
 */
import type { TreeNode } from '../store/types';
import { ROOT_NODE_ID } from '../store/types';
import { generateId } from '../shared/idGenerator';
import { getFlattenedOrder, getDepth } from '../store/operations';

/**
 * 使用されているインデント単位を検出
 * @param lines - テキスト行の配列
 * @returns インデント単位（スペースまたはタブ）
 */
const detectIndentUnit = (lines: string[]): string => {
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      // 最初のインデント文字を単位とする
      return match[1][0] === '\t' ? '\t' : ' ';
    }
  }
  return ' '; // デフォルトはスペース
};

/**
 * Scrapbox形式のテキストをTreeNode配列に変換
 * @param text - Scrapbox形式のテキスト（改行区切り）
 * @returns TreeNode配列（隠しルートノードを含む）
 */
export const parseScrapboxToTree = (text: string): TreeNode[] => {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) {
    // 空の場合は隠しルートのみを返す
    return [{ id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 }];
  }

  // 隠しルートノードを追加
  const nodes: TreeNode[] = [
    { id: ROOT_NODE_ID, text: '__root__', parentId: null, order: 0 }
  ];
  const stack: { depth: number; id: string }[] = [];
  const indentUnit = detectIndentUnit(lines);

  lines.forEach((line) => {
    // インデントレベルを計算
    const match = line.match(/^(\s*)/);
    const indentStr = match ? match[1] : '';
    // インデント単位で割ることで階層の深さを取得
    const depth =
      indentStr.length > 0
        ? indentStr.split(indentUnit).length - 1
        : 0;
    const text = line.trim();

    // 新しいノードを生成
    const id = generateId();

    // スタックを使って親を特定
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    // インデントなし（depth=0）の場合は隠しルートの子にする
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : ROOT_NODE_ID;

    // 同じ親の子ノード数を数えてorder決定
    const siblings = nodes.filter((n) => n.parentId === parentId);
    const order = siblings.length;

    nodes.push({ id, text, parentId, order });
    stack.push({ depth, id });
  });

  return nodes;
};

/**
 * TreeNode配列をScrapbox形式のテキストに変換
 * @param nodes - TreeNode配列
 * @returns Scrapbox形式のテキスト
 */
export const formatTreeToScrapbox = (nodes: TreeNode[]): string => {
  const lines: string[] = [];

  // DFS順で走査（アウトライナーの表示順序を保持）
  const orderedNodes = getFlattenedOrder(nodes);

  orderedNodes.forEach((node) => {
    // 各ノードの深さを計算
    const depth = getDepth(nodes, node.id);
    const indent = ' '.repeat(depth); // 1階層=1スペース
    lines.push(`${indent}${node.text}`);
  });

  return lines.join('\n');
};
