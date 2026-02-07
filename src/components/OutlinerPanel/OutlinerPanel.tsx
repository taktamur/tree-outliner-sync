import { useTreeStore } from '../../store/treeStore';
import { getChildren } from '../../utils/treeOperations';
import OutlinerItem from './OutlinerItem';
import './OutlinerPanel.css';

/**
 * アウトライナーパネルコンポーネント
 * テキストベースの階層構造エディタを提供
 * ルートノードを取得し、OutlinerItemが再帰的に子を表示する
 */
const OutlinerPanel = () => {
  const nodes = useTreeStore((s) => s.nodes);
  const rootNodes = getChildren(nodes, null); // parentId === null のルートノードを取得

  return (
    <div className="outliner-panel">
      <div className="outliner-header">Outliner</div>
      <div className="outliner-content">
        {/* 各ルートノードを描画（子は再帰的に描画される） */}
        {rootNodes.map((root) => (
          <OutlinerItem key={root.id} nodeId={root.id} />
        ))}
      </div>
    </div>
  );
};

export default OutlinerPanel;
