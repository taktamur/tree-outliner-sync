import { useEffect, useRef } from 'react';
import { useTreeStore } from '../../store/treeStore';
import { getChildren, getDepth } from '../../utils/treeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './OutlinerItem.css';

interface OutlinerItemProps {
  /** 表示対象のノードID */
  nodeId: string;
}

/**
 * アウトライナーの個別アイテムコンポーネント
 * 階層構造を再帰的に表示し、キーボードショートカットをサポート
 * 選択されたアイテムは自動的にフォーカスが当たる
 */
const OutlinerItem = ({ nodeId }: OutlinerItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { nodes, selectedNodeId, updateNodeText, setSelectedNodeId } = useTreeStore();
  const handleKeyDown = useKeyboardShortcuts(nodeId);

  // このノードの情報を取得
  const node = nodes.find((n) => n.id === nodeId);
  const children = getChildren(nodes, nodeId); // 子ノードを取得
  const depth = getDepth(nodes, nodeId); // 階層の深さを計算
  const isSelected = selectedNodeId === nodeId;

  // 選択状態が変わったらフォーカスを移動
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, selectedNodeId]);

  // ノードが存在しない場合は何も表示しない
  if (!node) return null;

  return (
    <div className="outliner-item-group">
      <div
        className={`outliner-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }} // 深さに応じてインデント
      >
        <span className="outliner-bullet">•</span>
        <input
          ref={inputRef}
          className="outliner-input"
          value={node.text}
          onChange={(e) => updateNodeText(nodeId, e.target.value)}
          onKeyDown={handleKeyDown} // Tab, Enter, Backspace, 矢印キーなど
          onFocus={() => setSelectedNodeId(nodeId)}
          placeholder="..."
        />
      </div>
      {/* 子ノードを再帰的に表示 */}
      {children.map((child) => (
        <OutlinerItem key={child.id} nodeId={child.id} />
      ))}
    </div>
  );
};

export default OutlinerItem;
