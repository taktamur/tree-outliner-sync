import { describe, it, expect } from 'vitest';
import { findClosestNode, determineDropTarget, type NodeRect } from './dragCalculator';

describe('dragCalculator', () => {
  describe('findClosestNode', () => {
    it('should find the closest node by Euclidean distance', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 200, y: 100, label: 'Node 1' }, // 距離: 100px
        { id: 'node2', x: 100, y: 200, label: 'Node 2' }, // 距離: 100px
        { id: 'node3', x: 300, y: 300, label: 'Node 3' }, // 距離: ~283px
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

      expect(result).toBe('node1');
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

      expect(result).toBeNull();
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

      expect(result).toBe('node1');
    });

    it('should handle boundary case (exactly at threshold)', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 0,
        y: 0,
        label: 'D',
      };

      // 120px離れたノードを配置（中心座標が120pxの距離になるように調整）
      const candidates: NodeRect[] = [
        { id: 'node1', x: 120, y: 0, label: 'N' },
      ];

      // 閾値ちょうどの場合
      const result1 = determineDropTarget(dragged, candidates, 120);
      // 距離が120未満なのでnodeIdが返る
      expect(result1).toBe('node1');

      // 閾値を少し下げた場合
      const result2 = determineDropTarget(dragged, candidates, 119);
      // 距離が119より大きいのでnullが返る
      expect(result2).toBeNull();
    });

    it('should return null when candidates are empty', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      const result = determineDropTarget(dragged, []);

      expect(result).toBeNull();
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
      expect(determineDropTarget(dragged, candidates, 30)).toBeNull();

      // 閾値100pxの場合は範囲内
      expect(determineDropTarget(dragged, candidates, 100)).toBe('node1');
    });
  });
});
