# poc-map-autoline

アウトライナー × ツリー可視化の双方向同期エディタ PoC。

## 基本ルール

- Claude とのやりとりは日本語で行うこと
- 判断に困ったらユーザと相談する
- PR作成時には、buildとlint unittestが通ることを確認してからマージする

## 技術スタック

- React 19 + TypeScript + Vite
- @xyflow/react（React Flow）: ツリー可視化
- dagre: LRレイアウト計算
- Zustand: 状態管理

## 開発コマンド

```bash
npm run dev      # 開発サーバー（http://localhost:5173）
npm run build    # tsc + vite build
npm run lint     # ESLint
```

## Git ルール

- `--force` / `-f` を伴う git 操作は禁止（`push --force`、`push --force-with-lease`、`reset --hard` など）

## アーキテクチャ上の注意点

### データモデル

- `TreeNode` はフラットリスト + `parentId` 方式（`src/types/tree.ts`）
- ネスト構造は描画時に `useMemo` で計算して導出する
- ルートノードは `parentId === null`、兄弟間の順序は `order` で管理

### 状態管理

- 全ツリー操作は `src/store/treeStore.ts`（Zustand）に集約
- ツリー操作の純粋関数は `src/utils/treeOperations.ts` に分離
- 両パネルが同一ストアを参照するため、片方の変更が自動的に反映される

### dagre の利用

- `@dagrejs/dagre` (v1) は Vite の ESM 環境で dynamic require エラーが出るため、`dagre` (v0.8) を使用
- 複数ルートは個別に dagre レイアウトして Y オフセットで縦積み（`src/utils/layoutCalculator.ts`）

### ツリー D&D

- `onNodeDragStop` で最近接ノードを検出（120px 閾値）
- 循環参照チェック: `getDescendantIds` で子孫を取得し、移動先が子孫でないことを確認
