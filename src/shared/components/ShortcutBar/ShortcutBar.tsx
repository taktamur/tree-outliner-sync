/**
 * キーボードショートカット表示バー
 *
 * アプリケーション下部に表示される操作方法の参照UI。
 * アウトライナーとツリー可視化それぞれの操作方法を表示する。
 */
import './ShortcutBar.css';

/**
 * ショートカット表示バー
 *
 * ユーザーが利用可能な操作を常時表示する。
 */
const ShortcutBar = () => {
  return (
    <div className="shortcut-bar">
      {/* アウトライナーの操作方法 */}
      <div className="shortcut-section">
        <span className="shortcut-title">Outliner:</span>
        <span className="shortcut-item">
          <kbd>Tab</kbd> インデント
        </span>
        <span className="shortcut-item">
          <kbd>Shift</kbd>+<kbd>Tab</kbd> アウトデント
        </span>
        <span className="shortcut-item">
          <kbd>Enter</kbd> 追加
        </span>
        <span className="shortcut-item">
          <kbd>Backspace</kbd> 削除（空時）
        </span>
        <span className="shortcut-item">
          <kbd>↑</kbd>/<kbd>↓</kbd> 移動
        </span>
      </div>
      <div className="shortcut-divider" />
      {/* ツリー可視化の操作方法 */}
      <div className="shortcut-section">
        <span className="shortcut-title">Tree:</span>
        <span className="shortcut-item">クリック: 選択</span>
        <span className="shortcut-item">ドラッグ: 移動</span>
        <span className="shortcut-item">空白にドロップ: ルート化</span>
      </div>
    </div>
  );
};

export default ShortcutBar;
