import './ShortcutBar.css';

const ShortcutBar = () => {
  return (
    <div className="shortcut-bar">
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
