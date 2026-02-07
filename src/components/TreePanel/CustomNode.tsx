import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

/** カスタムノードのデータ型 */
type CustomNodeData = {
  /** ノードに表示するテキスト */
  label: string;
  /** 選択状態（選択時は青色でハイライト） */
  selected: boolean;
};

/**
 * React Flow用のカスタムノードコンポーネント
 * ツリー可視化パネルで各ノードの見た目を定義
 * 選択状態に応じてスタイルが変化し、ドラッグ可能
 */
const CustomNode = ({ data }: NodeProps) => {
  const { label, selected } = data as unknown as CustomNodeData;

  return (
    <div
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        background: selected ? '#1976d2' : '#fff', // 選択時は青背景
        color: selected ? '#fff' : '#333',
        border: `2px solid ${selected ? '#1565c0' : '#ccc'}`,
        fontSize: '13px',
        fontWeight: 500,
        minWidth: '80px',
        textAlign: 'center',
        cursor: 'grab', // ドラッグ可能を示すカーソル
        boxShadow: selected ? '0 2px 8px rgba(25,118,210,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* 左側の接続ハンドル（親からのエッジを受け取る） */}
      <Handle type="target" position={Position.Left} style={{ background: '#888' }} />
      {label}
      {/* 右側の接続ハンドル（子へのエッジを出す） */}
      <Handle type="source" position={Position.Right} style={{ background: '#888' }} />
    </div>
  );
};

export default CustomNode;
