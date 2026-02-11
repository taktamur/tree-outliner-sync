import { describe, it, expect } from 'vitest';
import { findClosestNode, determineDropTarget, determineInsertMode, type NodeRect } from './dragCalculator';

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

  describe('determineInsertMode', () => {
    it('should return "before" when dragged to upper zone (top 1/3)', () => {
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'Target' };

      // 上側ゾーン: y < 100 + 40/3 = 113.33
      expect(determineInsertMode(105, 150, targetNode, true)).toBe('before');
      expect(determineInsertMode(110, 150, targetNode, true)).toBe('before');
    });

    it('should return "child" when dragged to middle zone (middle 1/3)', () => {
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'Target' };

      // 中央ゾーン: 113.33 <= y <= 126.67
      expect(determineInsertMode(120, 150, targetNode, true)).toBe('child');
    });

    it('should return "after" when dragged to lower zone (bottom 1/3)', () => {
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'Target' };

      // 下側ゾーン: y > 100 + 80/3 = 126.67
      expect(determineInsertMode(130, 150, targetNode, true)).toBe('after');
      expect(determineInsertMode(135, 150, targetNode, true)).toBe('after');
    });

    it('should handle boundary values correctly', () => {
      const targetNode: NodeRect = { id: 'target', x: 0, y: 0, label: 'Target' };

      // upperBound = NODE_HEIGHT / 3 = 13.33
      // lowerBound = (NODE_HEIGHT * 2) / 3 = 26.67

      // 境界値の少し下
      expect(determineInsertMode(13, 50, targetNode, true)).toBe('before');

      // 境界値付近（中央ゾーン）
      expect(determineInsertMode(14, 50, targetNode, true)).toBe('child');
      expect(determineInsertMode(26, 50, targetNode, true)).toBe('child');

      // 境界値の少し上
      expect(determineInsertMode(27, 50, targetNode, true)).toBe('after');
    });

    it('should prioritize "child" when dragged to right side of childless node', () => {
      // ターゲットノード: 幅80px (BASE_NODE_WIDTH)、左端x=100
      // rightBound = 100 + 80/3 = 126.67
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'T' };

      // 右側2/3（x > 126.67）にドロップした場合、縦位置に関わらず'child'
      expect(determineInsertMode(105, 140, targetNode, false)).toBe('child'); // 上側でも
      expect(determineInsertMode(120, 140, targetNode, false)).toBe('child'); // 中央でも
      expect(determineInsertMode(135, 140, targetNode, false)).toBe('child'); // 下側でも
    });

    it('should use vertical zone for childless node when dragged to left side', () => {
      // ターゲットノード: 幅80px、左端x=100
      // rightBound = 100 + 80/3 = 126.67
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'T' };

      // 左側1/3（x < 126.67）にドロップした場合は通常の縦ゾーン判定
      expect(determineInsertMode(105, 120, targetNode, false)).toBe('before'); // 上側
      expect(determineInsertMode(135, 120, targetNode, false)).toBe('after');  // 下側
    });

    it('should ignore horizontal detection for nodes with children', () => {
      const targetNode: NodeRect = { id: 'target', x: 100, y: 100, label: 'T' };

      // 子がいる場合は右側でも縦ゾーン判定のみ
      expect(determineInsertMode(105, 140, targetNode, true)).toBe('before'); // 上側
      expect(determineInsertMode(120, 140, targetNode, true)).toBe('child');  // 中央
      expect(determineInsertMode(135, 140, targetNode, true)).toBe('after');  // 下側
    });
  });

  describe('determineDropTarget', () => {
    it('should return nodeId with insertMode when within threshold', () => {
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100, // 中心Y座標: 100 + 20 = 120
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 150, y: 100, label: 'Node 1' }, // 距離: 50px
      ];

      const getHasChildren = () => true;
      const result = determineDropTarget(dragged, candidates, 120, getHasChildren);

      expect(result.parentId).toBe('node1');
      expect(result.insertMode).toBe('child'); // 中心Y座標120は中央ゾーン
      expect(result.targetNodeId).toBe('node1');
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
        y: 100, // 中心Y座標: 100 + 20 = 120
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 200, y: 100, label: 'Node 1' }, // 距離: 100px
      ];

      // 閾値を指定しない（デフォルト120px）
      const getHasChildren = () => false;
      const result = determineDropTarget(dragged, candidates, 120, getHasChildren);

      expect(result.parentId).toBe('node1');
      expect(result.insertMode).toBe('child'); // 中心Y座標120は中央ゾーン
      expect(result.targetNodeId).toBe('node1');
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

      const getHasChildren = () => true;

      // 距離119px、閾値120pxの場合 → 範囲内
      const result1 = determineDropTarget(dragged, candidates, 120, getHasChildren);
      expect(result1.parentId).toBe('node1');
      expect(result1.insertMode).toBe('child'); // 中心Y座標20は中央ゾーン
      expect(result1.targetNodeId).toBe('node1');

      // 距離119px、閾値119pxの場合 → 範囲外（distance < threshold なので）
      const result2 = determineDropTarget(dragged, candidates, 119, getHasChildren);
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
        y: 100, // 中心Y座標: 100 + 20 = 120
        label: 'Dragged',
      };

      const candidates: NodeRect[] = [
        { id: 'node1', x: 150, y: 100, label: 'Node 1' }, // 距離: 50px
      ];

      const getHasChildren = () => false;

      // 閾値30pxの場合は範囲外
      expect(determineDropTarget(dragged, candidates, 30, getHasChildren)).toEqual({ parentId: null });

      // 閾値100pxの場合は範囲内
      const result = determineDropTarget(dragged, candidates, 100, getHasChildren);
      expect(result.parentId).toBe('node1');
      expect(result.insertMode).toBe('child'); // 中心Y座標120は中央ゾーン
      expect(result.targetNodeId).toBe('node1');
    });

    it('should use horizontal detection for childless nodes', () => {
      // ドラッグされたノード: 中心(140, 120)
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'Dragged',
      };

      // ターゲットノード: 幅80px、x=200、右側2/3境界は x=226.67
      // 中心(240, 120)、距離: 100px
      const candidates: NodeRect[] = [
        { id: 'childless', x: 200, y: 100, label: 'N' },
      ];

      const getHasChildren = () => false;

      // ドラッグ中心X=140は右側2/3に入らないので通常の縦ゾーン判定
      const result = determineDropTarget(dragged, candidates, 120, getHasChildren);
      expect(result.insertMode).toBe('child'); // 中心Y=120は中央ゾーン
    });

    it('should not use horizontal detection for nodes with children', () => {
      // ドラッグされたノード: 幅80px、中心(140, 120)
      const dragged: NodeRect = {
        id: 'dragged',
        x: 100,
        y: 100,
        label: 'D',
      };

      // ターゲットノード: 幅80px、x=200、中心(240, 120)、距離: 100px
      const candidates: NodeRect[] = [
        { id: 'parent', x: 200, y: 100, label: 'P' },
      ];

      const getHasChildren = () => true;

      // 子がいる場合は右側でも通常の縦ゾーン判定
      const result = determineDropTarget(dragged, candidates, 120, getHasChildren);
      expect(result.insertMode).toBe('child'); // Y座標が中央ゾーン
    });
  });
});
