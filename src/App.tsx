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
 * - オーバーレイ: DebugPanel（Ctrl+Shift+D で表示）
 */
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import OutlinerPanel from "./outliner/OutlinerPanel";
import TreePanel from "./visualization/TreePanel";
import ShortcutBar from "./shared/components/ShortcutBar/ShortcutBar";
import DebugPanel from "./shared/components/DebugPanel/DebugPanel";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import "./App.css";

const DEFAULT_LEFT_PANEL_WIDTH = 350;
const MIN_LEFT_PANEL_WIDTH = 250;
const STORAGE_KEY = "leftPanelWidth";

/**
 * メインアプリケーション
 *
 * パネルリサイズ実装について:
 * 類似ライブラリ react-resizable-panels があるが、
 * この機能は軽量な実装で十分なため独自実装とした。
 */
function App() {
  // グローバルキーボードショートカット (Ctrl+Z / Ctrl+Shift+Z)
  useGlobalShortcuts();

  // localStorageから初期値を取得、なければデフォルト値を使用
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : DEFAULT_LEFT_PANEL_WIDTH;
  });

  // デバッグパネルの表示/非表示
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

  // 幅の変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(leftPanelWidth));
  }, [leftPanelWidth]);

  // Ctrl+Shift+D でデバッグパネルをトグル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsDebugPanelVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#4a90e2",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#e74c3c",
              secondary: "#fff",
            },
          },
        }}
      />
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
      {/* デバッグパネル (Ctrl+Shift+D でトグル) */}
      <DebugPanel
        isVisible={isDebugPanelVisible}
        onClose={() => setIsDebugPanelVisible(false)}
      />
    </div>
  );
}

export default App;
