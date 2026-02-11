import { describe, it, expect } from 'vitest';
import { findClosestNode, determineDropTarget, type NodeRect } from './dragCalculator';

describe('dragCalculator', () => {
  describe('findClosestNode', () => {
    it('should find the closest node by Euclidean distance', () => {
      // すべて同じラベル長（1文字）にして、幅を統一（BASE_NODE_WIDTH = 80px）
      // 中心座標: x + 40, y + 20
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'D', // 幅80px、中心(140, 120)
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 200, y: 100, label: 'N1' }, // 幅80px、中心(240, 120) → 距離: 100px
        { id: 'node2', x: 100, y: 200, label: 'N2' }, // 幅80px、中心(140, 220) → 距離: 100px
        { id: 'node3', x: 300, y: 300, label: 'N3' }, // 幅80px、中心(340, 320) → 距離: ~283px
      ];

      const result = findClosestNode(dragged, candidates);

      // node1とnode2は同距離なので、最初に見つかる方が選ばれる
      expect(result.nodeId).toMatch(/^(node1|node2)$/);
      expect(result.distance).toBeCloseTo(100, 1);
    });

    it('should return null when candidates are empty', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const result = findClosestNode(dragged, []);

      expect(result.nodeId).toBeNull();
      expect(result.distance).toBe(Infinity);
    });

    it('should correctly calculate distance with different node widths', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 0,
        y: 0,
        label: 'Short', // 短いラベル
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 100, y: 0, label: 'Very Long Label Text' }, // 長いラベル
      ];

      const result = findClosestNode(dragged, candidates);

      expect(result.nodeId).toBe('node1');
      // 中心座標を使うので、ノード幅の違いが距離計算に反映される
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should select the closest among multiple candidates', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'far', x: 500, y: 500, label: 'Far' },
        { id: 'close', x: 110, y: 110, label: 'Close' },
        { id: 'medium', x: 200, y: 200, label: 'Medium' },
      ];

      const result = findClosestNode(dragged, candidates);

      expect(result.nodeId).toBe('close');
      expect(result.distance).toBeLessThan(20);
    });
  });

  describe('determineDropTarget', () => {
    it('should return nodeId when within threshold', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 150, y: 100, label: 'Node 1' }, // 距離: 50px
      ];

      const result = determineDropTarget(dragged, candidates, 120);

      expect(result).toEqual({ parentId: 'node1' });
    });

    it('should return null when exceeding threshold', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 300, y: 300, label: 'Node 1' }, // 距離: ~283px
      ];

      const result = determineDropTarget(dragged, candidates, 120);

      expect(result).toEqual({ parentId: null });
    });

    it('should use default threshold of 120px', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 200, y: 100, label: 'Node 1' }, // 距離: 100px
      ];

      // 閾値を指定しない（デフォルト120px）
      const result = determineDropTarget(dragged, candidates);

      expect(result).toEqual({ parentId: 'node1' });
    });

    it('should handle boundary case (exactly at threshold)', () => {
      // 1文字ラベルは幅80px、中心は x+40, y+20
      const dragged: NodeRect = {
        id: 'dragged',
        x: 0,
        y: 0,
        label: 'D', // 中心(40, 20)
      };

      // 119px離れた位置に配置（中心間距離が119pxになるように）
      // 中心X座標: 40 + 119 = 159 → 左上X座標: 159 - 40 = 119
      const candidates: NodeRect[] = [
        { id: 'node1', x: 119, y: 0, label: 'N' }, // 中心(159, 20) → 距離: 119px
      ];

      // 距離119px、閾値120pxの場合 → 範囲内
      const result1 = determineDropTarget(dragged, candidates, 120);
      expect(result1).toEqual({ parentId: 'node1' });

      // 距離119px、閾値119pxの場合 → 範囲外（distance < threshold なので）
      const result2 = determineDropTarget(dragged, candidates, 119);
      expect(result2).toEqual({ parentId: null });
    });

    it('should return null when candidates are empty', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const result = determineDropTarget(dragged, []);

      expect(result).toEqual({ parentId: null });
    });

    it('should handle custom threshold values', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 150, y: 100, label: 'Node 1' }, // 距離: 50px
      ];

      // 閾値30pxの場合は範囲外
      expect(determineDropTarget(dragged, candidates, 30)).toEqual({ parentId: null });

      // 閾値100pxの場合は範囲内
      expect(determineDropTarget(dragged, candidates, 100)).toEqual({ parentId: 'node1' });
    });
  });
});
