import { v4 as uuidv4 } from 'uuid';

/**
 * 新しいノードIDを生成する
 *
 * UUID v4を使用してグローバルに一意なIDを生成する。
 * @returns 生成されたUUID文字列
 */
export const generateId = (): string => uuidv4();
