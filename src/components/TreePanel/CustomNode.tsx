import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

type CustomNodeData = {
  label: string;
  selected: boolean;
};

const CustomNode = ({ data }: NodeProps) => {
  const { label, selected } = data as unknown as CustomNodeData;

  return (
    <div
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        background: selected ? '#1976d2' : '#fff',
        color: selected ? '#fff' : '#333',
        border: `2px solid ${selected ? '#1565c0' : '#ccc'}`,
        fontSize: '13px',
        fontWeight: 500,
        minWidth: '80px',
        textAlign: 'center',
        cursor: 'grab',
        boxShadow: selected ? '0 2px 8px rgba(25,118,210,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#888' }} />
      {label}
      <Handle type="source" position={Position.Right} style={{ background: '#888' }} />
    </div>
  );
};

export default CustomNode;
