/**
 * アプリケーションルートコンポーネント
 *
 * アウトライナーとツリー可視化の2パネル構成で、
 * 両者は同一のZustandストアを参照するため双方向同期が自動的に実現される。
 *
 * 構成:
 * - 左パネル: OutlinerPanel（テキストベースの階層編集）
 * - 右パネル: TreePanel（ビジュアルツリー表示とD&D操作）
 * - 下部: ShortcutBar（キーボードショートカット一覧）
 */
import OutlinerPanel from './components/OutlinerPanel/OutlinerPanel';
import TreePanel from './components/TreePanel/TreePanel';
import ShortcutBar from './components/ShortcutBar/ShortcutBar';
import './App.css';

/**
 * メインアプリケーション
 */
function App() {
  return (
    <div className="app">
      <div className="app-main">
        {/* 左パネル: アウトライナー */}
        <div className="panel-left">
          <OutlinerPanel />
        </div>
        <div className="panel-divider" />
        {/* 右パネル: ツリー可視化 */}
        <div className="panel-right">
          <TreePanel />
        </div>
      </div>
      {/* キーボードショートカット表示 */}
      <ShortcutBar />
    </div>
  );
}

export default App;
