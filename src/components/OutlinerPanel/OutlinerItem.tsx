/**
 * アウトライナーアイテムコンポーネント
 *
 * アウトライナー表示における個別のノードを表示する。
 * テキスト編集とキーボードショートカットをサポートし、子ノードを再帰的に表示する。
 */
import { useEffect, useRef } from 'react';
import { useTreeStore } from '../../store/treeStore';
import { getChildren, getDepth } from '../../utils/treeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './OutlinerItem.css';

/** OutlinerItemコンポーネントのProps */
interface OutlinerItemProps {
  /** 表示するノードのID */
  nodeId: string;
}

/**
 * アウトライナーの個別ノード表示
 *
 * 再帰的に子ノードをレンダリングし、ツリー構造を表現する。
 * @param nodeId 表示するノードのID
 */
const OutlinerItem = ({ nodeId }: OutlinerItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { nodes, selectedNodeId, updateNodeText, setSelectedNodeId } = useTreeStore();
  const handleKeyDown = useKeyboardShortcuts(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  const children = getChildren(nodes, nodeId);
  const depth = getDepth(nodes, nodeId); // インデント深さを計算
  const isSelected = selectedNodeId === nodeId;

  // 選択されたノードにフォーカスを当てる
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  if (!node) return null;

  return (
    <div className="outliner-item-group">
      <div
        className={`outliner-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }} // 階層の深さに応じてインデント
      >
        <span className="outliner-bullet">•</span>
        <input
          ref={inputRef}
          className="outliner-input"
          value={node.text}
          onChange={(e) => updateNodeText(nodeId, e.target.value)}
          onKeyDown={handleKeyDown} // Tab, Enter, Backspace等のショートカット
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
