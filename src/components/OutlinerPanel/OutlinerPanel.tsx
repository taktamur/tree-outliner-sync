import { useTreeStore } from '../../store/treeStore';
import { getChildren } from '../../utils/treeOperations';
import OutlinerItem from './OutlinerItem';
import './OutlinerPanel.css';

const OutlinerPanel = () => {
  const nodes = useTreeStore((s) => s.nodes);
  const rootNodes = getChildren(nodes, null);

  return (
    <div className="outliner-panel">
      <div className="outliner-header">Outliner</div>
      <div className="outliner-content">
        {rootNodes.map((root) => (
          <OutlinerItem key={root.id} nodeId={root.id} />
        ))}
      </div>
    </div>
  );
};

export default OutlinerPanel;
