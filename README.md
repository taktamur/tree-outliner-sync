# PoC: アウトライナー × ツリー可視化 双方向同期エディタ

Scrapboxの箇条書きフォーマットとマインドマップ的なGUI操作を連動させる2画面構成のエディタ。左側のアウトライナーで階層を変更すると右側のツリー図も変わり、右側のツリー図でノードをドラッグすると左側の階層も変化する。

```
┌─────────────────────┬──────────────────────────────────┐
│  Outliner (左)       │  Tree Visualization (右)          │
│                     │                                  │
│  • Root 1           │  Root1 ─→ Child1.1 ─→ Child1.1.1│
│    • Child 1.1      │         ─→ Child1.2              │
│      • Child 1.1.1  │                                  │
│    • Child 1.2      │  Root2 ─→ Child2.1               │
│  • Root 2           │         ─→ Child2.2              │
│    • Child 2.1      │                                  │
│    • Child 2.2      │                                  │
└─────────────────────┴──────────────────────────────────┘
         ↕ 双方向同期 ↕
```

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## キーボード操作（アウトライナー側）

| キー | 動作 |
|------|------|
| `Tab` | インデント（直上の兄弟の子にする） |
| `Shift+Tab` | アウトデント（親の兄弟にする） |
| `Enter` | 現在ノードの直後に同階層の兄弟を追加 |
| `Backspace`（空テキスト時） | ノード削除（子は一つ上の階層に昇格） |
| `↑` / `↓` | フォーカスを前後のアイテムに移動 |

## ツリー側操作

| 操作 | 動作 |
|------|------|
| ノードクリック | 選択（アウトライナー側もハイライト） |
| ノードをドラッグ＆ドロップ | 近くのノードの子にする（120px以内） |
| 空白エリアにドロップ | ルートノードにする |
| ズーム / パン | マウスホイール / ドラッグ |

## 技術スタック

| 項目 | 選定 |
|------|------|
| フレームワーク | React + TypeScript |
| ビルドツール | Vite |
| ツリー可視化 | @xyflow/react (React Flow) |
| レイアウト計算 | dagre（LR方向 + 複数ルート縦積み） |
| 状態管理 | Zustand |
| ID生成 | uuid |

## アーキテクチャ

### データモデル

フラットリスト + parentId方式を採用。React Flowがフラットなnode/edge配列を期待するため、ネスト構造は描画時に計算で導出する。

```typescript
interface TreeNode {
  id: string;              // UUID
  text: string;            // ノードのテキスト
  parentId: string | null; // 親ID（ルートはnull）
  order: number;           // 兄弟間の表示順序
}
```

### ファイル構成

```
src/
├── types/tree.ts                  # TreeNode型定義
├── store/treeStore.ts             # Zustandストア（全操作の中心）
├── utils/
│   ├── idGenerator.ts             # UUID生成
│   ├── treeOperations.ts          # indent/outdent/move等の純粋関数
│   └── layoutCalculator.ts        # dagre LRレイアウト + 複数ルート縦積み
├── hooks/
│   ├── useKeyboardShortcuts.ts    # キーボード操作
│   └── useTreeLayout.ts           # ストア→React Flow変換フック
├── components/
│   ├── OutlinerPanel/
│   │   ├── OutlinerPanel.tsx      # アウトライナー全体
│   │   ├── OutlinerPanel.css
│   │   ├── OutlinerItem.tsx       # 個別アイテム（再帰レンダリング）
│   │   └── OutlinerItem.css
│   └── TreePanel/
│       ├── TreePanel.tsx          # React Flowラッパー
│       ├── TreePanel.css
│       └── CustomNode.tsx         # カスタムノード描画
├── App.tsx                        # 2カラムレイアウト
└── App.css
```

### データフロー

```
アウトライナー操作 (Tab/Enter/etc.)
        ↓
  Zustand Store (nodes[])  ← ツリーD&D (onNodeDragStop)
        ↓
  useTreeLayout (useMemo)
        ↓
  dagre レイアウト計算
        ↓
  React Flow レンダリング
```

両パネルは同一のZustandストアを参照するため、片方の変更が即座にもう片方に反映される。

### レイアウト計算（複数ルートの縦積み）

従来のマインドマップと異なり、ルートノードがN個存在するフォレスト構造をサポートする。

1. ルートノードをorder順にソート
2. 各ルートのサブツリーをdagreで個別にLR（左→右）レイアウト計算
3. Y座標にオフセットを加算して縦に積む
4. 全ノードの位置とエッジをReact Flowに渡す

### エッジケース対策

- ルートノード（`parentId === null`）はアウトデント不可
- 兄弟の最初のノードはインデント不可（上の兄弟が必要）
- ノードを自分の子孫に移動させない（循環参照防止）
- 子を持つノードの削除時は子を一つ上の階層に昇格

## スコープ外（将来対応）

- データの永続化（LocalStorage / ファイル保存）
- Undo/Redo
- 折りたたみ機能
- ノードのドラッグ&ドロップによる兄弟間並べ替え（Outliner側）
- アニメーション付きレイアウト遷移
- マルチ選択

## npm scripts

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run preview  # ビルド結果のプレビュー
npm run lint     # ESLint実行
```
