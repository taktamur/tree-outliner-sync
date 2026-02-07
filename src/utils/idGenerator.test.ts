import { describe, it, expect } from 'vitest';
import { generateId } from './idGenerator';

describe('idGenerator', () => {
  describe('generateId', () => {
    it('UUIDを生成できる', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('UUID v4形式である（xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx）', () => {
      const id = generateId();
      // UUID v4の正規表現パターン
      const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidV4Pattern);
    });

    it('呼び出すたびに異なるIDを生成する', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('大量に生成しても重複しない（確率的テスト）', () => {
      const ids = new Set<string>();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateId());
      }

      // すべてのIDがユニークであることを確認
      expect(ids.size).toBe(count);
    });
  });
});
