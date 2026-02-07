/**
 * アウトライナーパネルコンポーネント
 *
 * ツリー構造をテキストベースで階層表示するアウトライナーUI。
 * ルートノードのみを直接レンダリングし、子ノードはOutlinerItemが再帰的に表示する。
 */
import { useTreeStore } from '../../store/treeStore';
import { getChildren } from '../../utils/treeOperations';
import OutlinerItem from './OutlinerItem';
import './OutlinerPanel.css';

/**
 * アウトライナーパネル
 *
 * ツリーストアからルートノードを取得し、それぞれをOutlinerItemで表示する。
 */
const OutlinerPanel = () => {
  const nodes = useTreeStore((s) => s.nodes);
  const rootNodes = getChildren(nodes, null); // parentId === null のノードを取得

  return (
    <div className="outliner-panel">
      <div className="outliner-header">Outliner</div>
      <div className="outliner-content">
        {/* ルートノードをそれぞれ表示（子は再帰的に表示される） */}
        {rootNodes.map((root) => (
          <OutlinerItem key={root.id} nodeId={root.id} />
        ))}
      </div>
    </div>
  );
};

export default OutlinerPanel;
