import { useMemo } from 'react';
import { useTreeStore } from '../store/treeStore';
import { calculateLayout } from '../utils/layoutCalculator';
import type { Node, Edge } from '@xyflow/react';

export const useTreeLayout = (): { nodes: Node[]; edges: Edge[] } => {
  const storeNodes = useTreeStore((s) => s.nodes);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  return useMemo(() => {
    const layout = calculateLayout(storeNodes);

    const nodes: Node[] = layout.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: { ...n.data, selected: n.id === selectedNodeId },
      type: 'custom',
    }));

    const edges: Edge[] = layout.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      style: { stroke: '#888', strokeWidth: 1.5 },
    }));

    return { nodes, edges };
  }, [storeNodes, selectedNodeId]);
};
