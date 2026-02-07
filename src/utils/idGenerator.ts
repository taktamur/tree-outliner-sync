import { v4 as uuidv4 } from 'uuid';

/**
 * UUID v4を使用してユニークなIDを生成
 * ノード作成時に使用
 */
export const generateId = (): string => uuidv4();
