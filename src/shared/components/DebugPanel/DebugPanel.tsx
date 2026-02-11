/**
 * デバッグパネルコンポーネント
 *
 * ストアの状態を可視化するオーバーレイパネル。
 * 右上のボタンで表示/非表示を切り替え可能。
 *
 * 表示内容:
 * - ノード一覧（フラット表示）
 * - ツリー構造（階層表示）
 * - 統計情報（ノード数、ルートノード数）
 * - JSON形式での全データ表示
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTreeStore } from '../../../store/treeStore';
import type { TreeNode } from '../../../store/types';
import './DebugPanel.css';

interface DebugPanelProps {
  /** パネルの表示/非表示 */
  isVisible: boolean;
  /** 閉じるボタンのコールバック */
  onClose: () => void;
}

/**
 * ツリー構造を階層表示用に変換
 */
interface TreeNodeWithDepth {
  node: TreeNode;
  depth: number;
}

/**
 * ノードの階層を計算してフラット配列に変換
 */
const flattenTreeWithDepth = (nodes: TreeNode[]): TreeNodeWithDepth[] => {
  const result: TreeNodeWithDepth[] = [];
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // ルートノードを取得（order順）
  const roots = nodes.filter((n) => n.parentId === null).sort((a, b) => a.order - b.order);

  // 再帰的に子を追加
  const addChildren = (parentId: string | null, depth: number) => {
    const children = nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);

    children.forEach((child) => {
      result.push({ node: child, depth });
      addChildren(child.id, depth + 1);
    });
  };

  // ルートノードから開始
  roots.forEach((root) => {
    result.push({ node: root, depth: 0 });
    addChildren(root.id, 1);
  });

  return result;
};

/**
 * デバッグパネル本体
 */
const DebugPanel = ({ isVisible, onClose }: DebugPanelProps) => {
  const { nodes, selectedNodeId } = useTreeStore();
  const [activeTab, setActiveTab] = useState<'flat' | 'tree' | 'json'>('flat');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 統計情報の計算
  const stats = useMemo(() => {
    const rootCount = nodes.filter((n) => n.parentId === null).length;
    return {
      totalNodes: nodes.length,
      rootNodes: rootCount,
      childNodes: nodes.length - rootCount,
    };
  }, [nodes]);

  // 階層表示用のデータ
  const treeWithDepth = useMemo(() => flattenTreeWithDepth(nodes), [nodes]);

  // JSON表示用のデータ
  const jsonData = useMemo(
    () => JSON.stringify({ nodes, selectedNodeId }, null, 2),
    [nodes, selectedNodeId]
  );

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.debug-panel-resize-handle')) {
      setIsResizing(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    } else if ((e.target as HTMLElement).closest('.debug-panel-header')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  // ドラッグ・リサイズ処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setSize((prev) => ({
          width: Math.max(400, prev.width + deltaX),
          height: Math.max(300, prev.height + deltaY),
        }));
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // JSON をクリップボードにコピー
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      alert('JSONをクリップボードにコピーしました');
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className="debug-panel"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* ヘッダー */}
      <div className="debug-panel-header">
        <div className="debug-panel-title">🐛 Debug Panel</div>
        <button className="debug-panel-close" onClick={onClose}>
          ×
        </button>
      </div>

      {/* 統計情報 */}
      <div className="debug-panel-stats">
        <span>全ノード: {stats.totalNodes}</span>
        <span>ルート: {stats.rootNodes}</span>
        <span>子ノード: {stats.childNodes}</span>
        {selectedNodeId && <span>選択中: {selectedNodeId.slice(0, 8)}...</span>}
      </div>

      {/* タブ切り替え */}
      <div className="debug-panel-tabs">
        <button
          className={activeTab === 'flat' ? 'active' : ''}
          onClick={() => setActiveTab('flat')}
        >
          フラット表示
        </button>
        <button
          className={activeTab === 'tree' ? 'active' : ''}
          onClick={() => setActiveTab('tree')}
        >
          ツリー表示
        </button>
        <button
          className={activeTab === 'json' ? 'active' : ''}
          onClick={() => setActiveTab('json')}
        >
          JSON
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="debug-panel-content">
        {/* フラット表示 */}
        {activeTab === 'flat' && (
          <div className="debug-panel-flat">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Text</th>
                  <th>ParentID</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr
                    key={node.id}
                    className={node.id === selectedNodeId ? 'selected' : ''}
                  >
                    <td className="debug-panel-id">{node.id.slice(0, 8)}...</td>
                    <td>{node.text}</td>
                    <td className="debug-panel-id">
                      {node.parentId ? `${node.parentId.slice(0, 8)}...` : 'null'}
                    </td>
                    <td>{node.order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ツリー表示 */}
        {activeTab === 'tree' && (
          <div className="debug-panel-tree">
            {treeWithDepth.map(({ node, depth }) => (
              <div
                key={node.id}
                className={`debug-panel-tree-item ${node.id === selectedNodeId ? 'selected' : ''}`}
                style={{ paddingLeft: `${depth * 20 + 10}px` }}
              >
                <span className="debug-panel-tree-icon">
                  {node.parentId === null ? '📁' : '📄'}
                </span>
                <span className="debug-panel-tree-text">{node.text}</span>
                <span className="debug-panel-tree-meta">
                  (id: {node.id.slice(0, 8)}..., order: {node.order})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* JSON表示 */}
        {activeTab === 'json' && (
          <div className="debug-panel-json">
            <button className="debug-panel-copy-btn" onClick={handleCopyJson}>
              📋 コピー
            </button>
            <pre>{jsonData}</pre>
          </div>
        )}
      </div>

      {/* リサイズハンドル */}
      <div className="debug-panel-resize-handle">⋰</div>
    </div>
  );
};

export default DebugPanel;
