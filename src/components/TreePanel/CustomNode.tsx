/**
 * カスタムノードコンポーネント
 *
 * React Flowのツリー可視化で使用するカスタムノード。
 * 選択状態に応じてスタイルを変更し、ドラッグ操作が可能。
 */
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

/** カスタムノードのデータ型 */
type CustomNodeData = {
  /** ノードに表示するテキスト */
  label: string;
  /** 選択状態フラグ */
  selected: boolean;
};

/**
 * ツリー可視化用のカスタムノード
 *
 * @param data ノードデータ（label, selected）
 * @param dragging ドラッグ中かどうか
 */
const CustomNode = ({ data, dragging }: NodeProps) => {
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
        cursor: dragging ? 'grabbing' : 'grab', // ドラッグ中はgrabbing、通常時はgrab
        boxShadow: selected ? '0 2px 8px rgba(25,118,210,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        transition: dragging ? 'none' : 'all 0.3s ease-out', // ドラッグ中はtransitionを無効化
      }}
    >
      {/* 左側の接続ハンドル（親からの入力） */}
      <Handle type="target" position={Position.Left} style={{ background: '#888' }} />
      {label}
      {/* 右側の接続ハンドル（子への出力） */}
      <Handle type="source" position={Position.Right} style={{ background: '#888' }} />
    </div>
  );
};

export default CustomNode;
