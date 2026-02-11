/**
 * テキスト幅測定ユーティリティ
 *
 * Canvas API を使用してテキストの実際の幅を測定する。
 * CustomNode.tsx のフォント設定と一致させることで、
 * レイアウト計算とレンダリングの整合性を保つ。
 */

/** ノードの基本幅（px） */
const BASE_NODE_WIDTH = 80;
/** パディング（左右合計、px） */
const HORIZONTAL_PADDING = 32; // 8px * 2 (padding) + 16px (余白)
/** フォールバック用の1文字あたりの概算幅（px） */
const FALLBACK_CHAR_WIDTH = 8;

/**
 * Canvas コンテキストをキャッシュ（パフォーマンス最適化）
 * Canvas 生成は1回だけ行い、再利用する
 */
let cachedContext: CanvasRenderingContext2D | null = null;

/**
 * Canvas 2D コンテキストを取得（キャッシュ付き）
 *
 * @returns Canvas 2D コンテキスト、取得失敗時は null
 */
const getCanvasContext = (): CanvasRenderingContext2D | null => {
  if (cachedContext) {
    return cachedContext;
  }

  if (typeof document === 'undefined') {
    // SSR環境では Canvas API が使えない
    return null;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // CustomNode.tsx のフォント設定と一致させる
    ctx.font = '500 13px sans-serif';
    cachedContext = ctx;
  }
  return ctx;
};

/**
 * Canvas API を使用してテキストの実際の幅を測定
 *
 * @param text 測定するテキスト
 * @returns テキストの幅（px）
 */
export const measureTextWidth = (text: string): number => {
  const ctx = getCanvasContext();

  if (!ctx) {
    // Canvas API が使えない場合はフォールバック
    return text.length * FALLBACK_CHAR_WIDTH;
  }

  return ctx.measureText(text).width;
};

/**
 * テキストの長さからノードの幅を計算
 *
 * Canvas API でテキスト幅を測定し、パディングを加算してノード幅を決定する。
 *
 * @param text ノードのテキスト
 * @returns ノードの幅（px）
 */
export const calculateNodeWidth = (text: string): number => {
  const textWidth = measureTextWidth(text);
  const totalWidth = Math.max(BASE_NODE_WIDTH, textWidth + HORIZONTAL_PADDING);
  return totalWidth;
};
