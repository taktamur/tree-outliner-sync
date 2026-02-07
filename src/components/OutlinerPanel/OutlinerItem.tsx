import { useEffect, useRef } from 'react';
import { useTreeStore } from '../../store/treeStore';
import { getChildren, getDepth } from '../../utils/treeOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './OutlinerItem.css';

interface OutlinerItemProps {
  nodeId: string;
}

const OutlinerItem = ({ nodeId }: OutlinerItemProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { nodes, selectedNodeId, updateNodeText, setSelectedNodeId } = useTreeStore();
  const handleKeyDown = useKeyboardShortcuts(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  const children = getChildren(nodes, nodeId);
  const depth = getDepth(nodes, nodeId);
  const isSelected = selectedNodeId === nodeId;

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, selectedNodeId]);

  if (!node) return null;

  return (
    <div className="outliner-item-group">
      <div
        className={`outliner-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <span className="outliner-bullet">•</span>
        <input
          ref={inputRef}
          className="outliner-input"
          value={node.text}
          onChange={(e) => updateNodeText(nodeId, e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setSelectedNodeId(nodeId)}
          placeholder="..."
        />
      </div>
      {children.map((child) => (
        <OutlinerItem key={child.id} nodeId={child.id} />
      ))}
    </div>
  );
};

export default OutlinerItem;
