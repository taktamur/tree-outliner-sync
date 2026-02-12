/**
 * アウトライナーパネルコンポーネント
 *
 * ツリー構造をテキストベースで階層表示するアウトライナーUI。
 * ルートノードのみを直接レンダリングし、子ノードはOutlinerItemが再帰的に表示する。
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTreeStore } from '../store/treeStore';
import { ROOT_NODE_ID } from '../store/types';
import { getChildren } from '../store/operations';
import OutlinerItem from './OutlinerItem';
import ConfirmDialog from '../shared/components/ConfirmDialog/ConfirmDialog';
import './OutlinerPanel.css';

/**
 * アウトライナーパネル
 *
 * ツリーストアからルートノードを取得し、それぞれをOutlinerItemで表示する。
 */
const OutlinerPanel = () => {
  const nodes = useTreeStore((s) => s.nodes);
  const importFromScrapbox = useTreeStore((s) => s.importFromScrapbox);
  const exportToScrapbox = useTreeStore((s) => s.exportToScrapbox);
  const rootNodes = getChildren(nodes, ROOT_NODE_ID); // 隠しルートノードの子を取得

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error('インポートするテキストを入力してください');
      return;
    }

    // 既存データがある場合は確認ダイアログを表示
    if (nodes.length > 0) {
      setIsConfirmDialogOpen(true);
    } else {
      executeImport();
    }
  };

  const executeImport = () => {
    try {
      importFromScrapbox(importText);
      setImportText('');
      setIsImportModalOpen(false);
      setIsConfirmDialogOpen(false);
      toast.success('Scrapbox形式のテキストをインポートしました');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      toast.error(`インポートに失敗しました: ${errorMessage}`);
      console.error('Import error:', error);
    }
  };

  const handleCancelImport = () => {
    setIsConfirmDialogOpen(false);
  };

  const handleExport = () => {
    try {
      const text = exportToScrapbox();
      navigator.clipboard.writeText(text).then(
        () => {
          toast.success('Scrapbox形式のテキストをクリップボードにコピーしました');
        },
        (error) => {
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          toast.error(`クリップボードへのコピーに失敗しました: ${errorMessage}`);
          console.error('Clipboard error:', error);
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      toast.error(`エクスポートに失敗しました: ${errorMessage}`);
      console.error('Export error:', error);
    }
  };

  return (
    <div className="outliner-panel">
      <div className="outliner-header">
        <div className="outliner-header-content">
          <span>Outliner</span>
          <div className="outliner-header-buttons">
            <button
              className="outliner-btn"
              onClick={handleImportClick}
              title="Scrapboxからインポート"
            >
              Import
            </button>
            <button
              className="outliner-btn"
              onClick={handleExport}
              title="Scrapboxへエクスポート"
            >
              Export
            </button>
          </div>
        </div>
      </div>
      <div className="outliner-content">
        {/* ルートノードをそれぞれ表示（子は再帰的に表示される） */}
        {rootNodes.map((root) => (
          <OutlinerItem key={root.id} nodeId={root.id} />
        ))}
      </div>

      {/* インポートモーダル */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Scrapboxからインポート</h3>
            <textarea
              className="import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Scrapbox形式のテキストを貼り付けてください..."
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn modal-btn-cancel" onClick={() => setIsImportModalOpen(false)}>
                キャンセル
              </button>
              <button className="modal-btn modal-btn-primary" onClick={handleImport}>
                インポート
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title="データの上書き確認"
          message="現在のデータは失われます。続行しますか?"
          confirmLabel="続行"
          cancelLabel="キャンセル"
          onConfirm={executeImport}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
};

export default OutlinerPanel;
