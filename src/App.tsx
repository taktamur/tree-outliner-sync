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
import { useState, useEffect } from 'react';
import OutlinerPanel from './outliner/OutlinerPanel';
import TreePanel from './visualization/TreePanel';
import ShortcutBar from './shared/components/ShortcutBar/ShortcutBar';
import './App.css';

const DEFAULT_LEFT_PANEL_WIDTH = 350;
const MIN_LEFT_PANEL_WIDTH = 250;
const STORAGE_KEY = 'leftPanelWidth';

/**
 * メインアプリケーション
 *
 * パネルリサイズ実装について:
 * 類似ライブラリ react-resizable-panels があるが、
 * この機能は軽量な実装で十分なため独自実装とした。
 */
function App() {
  // localStorageから初期値を取得、なければデフォルト値を使用
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : DEFAULT_LEFT_PANEL_WIDTH;
  });

  // 幅の変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(leftPanelWidth));
  }, [leftPanelWidth]);

  /**
   * マウスダウン時のハンドラ
   * ドキュメント全体にmousemove/mouseupリスナーを追加してドラッグを処理
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(MIN_LEFT_PANEL_WIDTH, startWidth + delta);
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  /**
   * ダブルクリック時のハンドラ
   * デフォルト幅にリセット
   */
  const handleDoubleClick = () => {
    setLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH);
  };

  return (
    <div className="app">
      <div className="app-main">
        {/* 左パネル: アウトライナー */}
        <div className="panel-left" style={{ width: `${leftPanelWidth}px` }}>
          <OutlinerPanel />
        </div>
        <div
          className="panel-divider"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        />
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
