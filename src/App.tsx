import OutlinerPanel from './components/OutlinerPanel/OutlinerPanel';
import TreePanel from './components/TreePanel/TreePanel';
import ShortcutBar from './components/ShortcutBar/ShortcutBar';
import './App.css';

/**
 * メインアプリケーションコンポーネント
 * 左側にアウトライナーパネル、右側にツリー可視化パネルを配置
 * 両パネルは同一のZustandストアを参照するため、自動的に同期される
 * 下部にキーボードショートカットのガイドバーを表示
 */
function App() {
  return (
    <div className="app">
      <div className="app-main">
        {/* 左パネル: テキストベースのアウトライナー */}
        <div className="panel-left">
          <OutlinerPanel />
        </div>
        {/* パネル間の区切り線 */}
        <div className="panel-divider" />
        {/* 右パネル: ツリー構造の可視化 */}
        <div className="panel-right">
          <TreePanel />
        </div>
      </div>
      {/* ショートカットキーガイドバー */}
      <ShortcutBar />
    </div>
  );
}

export default App;
