/**
 * テキスト幅の測定ユーティリティ
 *
 * Canvas API の measureText() を使用してテキストの実際の幅を測定する。
 * CustomNode.tsx のフォント設定（500 13px sans-serif）に合わせて測定。
 */

/** ノードの基本幅（最小幅、px） */
const BASE_NODE_WIDTH = 80;
/** ノードの高さ（px） */
export const NODE_HEIGHT = 40;
/** パディング（左右合計、px） */
const HORIZONTAL_PADDING = 32; // 8px * 2 (padding) + 16px (余白)
/** フォールバック用の1文字あたりの概算幅（px） */
const FALLBACK_CHAR_WIDTH = 8;

/** Canvas コンテキストのキャッシュ */
let cachedCanvasContext: CanvasRenderingContext2D | null = null;

/**
 * Canvas 2D コンテキストを取得（キャッシュ付き）
 *
 * @returns Canvas 2D コンテキスト、または null（Canvas API が使えない場合）
 */
const getCanvasContext = (): CanvasRenderingContext2D | null => {
  if (cachedCanvasContext) {
    return cachedCanvasContext;
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // CustomNode.tsx と同じフォント設定
      ctx.font = '500 13px sans-serif';
      cachedCanvasContext = ctx;
    }
    return ctx;
  } catch {
    // Canvas API が使えない環境（SSR など）ではnullを返す
    return null;
  }
};

/**
 * Canvas API を使ってテキストの実際の幅を測定
 *
 * フォント設定: 500 13px sans-serif（CustomNode.tsx と同じ）
 *
 * @param text 測定対象のテキスト
 * @returns テキストの幅（px）、Canvas API が使えない場合は簡易計算値
 */
export const measureTextWidth = (text: string): number => {
  const ctx = getCanvasContext();

  if (ctx) {
    // Canvas API でテキスト幅を測定
    const metrics = ctx.measureText(text);
    return metrics.width;
  }

  // フォールバック: 簡易計算（Canvas API が使えない環境向け）
  return text.length * FALLBACK_CHAR_WIDTH;
};

/**
 * テキストの幅からノードの幅を計算
 *
 * テキスト幅 + パディングを加算し、最小幅（BASE_NODE_WIDTH）を下回らないようにする。
 *
 * @param text ノードのテキスト
 * @returns ノードの幅（px）
 */
export const calculateNodeWidth = (text: string): number => {
  const textWidth = measureTextWidth(text);
  const totalWidth = Math.max(BASE_NODE_WIDTH, textWidth + HORIZONTAL_PADDING);
  return totalWidth;
};
