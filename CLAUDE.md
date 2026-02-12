# poc-map-autoline

アウトライナー × ツリー可視化の双方向同期エディタ PoC。

## 基本ルール

- Claude とのやりとりは日本語で行うこと
- 判断に困ったらユーザと相談する
- PR作成時には、build・lint・unittestが全て通ることを確認してからマージする

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
npm test         # ユニットテスト（watch モード）
npm run test:run # ユニットテスト（1回実行）
```

## Git ルール

- `--force` / `-f` を伴う git 操作は禁止（`push --force`、`push --force-with-lease`、`reset --hard` など）
- Bashでgitコマンドを実行する際は、`&&` で複数コマンドを繋げず、1コマンドずつ個別に実行すること（例: `git add .` と `git commit -m "..."` は別々のBash呼び出しで実行）
- `git commit -m` のメッセージに `$()` やヒアドキュメント（`<<EOF`）を使わず、直接文字列で指定すること
- `git commit -m` のメッセージは改行を含めず1行で書くこと（複数行のコミットメッセージは使わない）

### PR作成時のルール

- **PRのbodyには絵文字を含めないこと**
  - GitHub PR作成リンクのURL内で絵文字をエンコードすると、URLが壊れる可能性があるため
  - PR本文には通常のテキストのみを使用し、視覚的な強調が必要な場合はマークダウンの太字や見出しを使用する

## パッケージ管理ルール

- 新しいパッケージを追加する際は `npm install <package>` を使用すること
- 手動でpackage.jsonを編集した場合は必ず `npm install` を実行してpackage-lock.jsonを更新すること
- PRにはpackage.jsonとpackage-lock.jsonの両方を含めること
- package.jsonとpackage-lock.jsonの不一致はCIビルド失敗の原因となるため注意

## Claude Code 実行権限設定

Claude Code からビルド・lint・テストコマンドを実行するには、以下の権限設定が必要です。

### ローカル環境（Claude Code CLI）

ローカルで Claude Code CLI を使用する場合は、`~/.claude/config.json` に以下を追加:

```json
{
  "allowedPrompts": [
    {
      "tool": "Bash",
      "prompt": "npm *"
    }
  ]
}
```

これにより、`npm install`, `npm run build`, `npm run lint`, `npm run test` など、全てのnpmコマンドが許可されます。

### GitHub Actions（Claude Code GitHub Action）

GitHub Actions で動作する Claude Code に権限を付与するには、`.github/workflows/claude.yml` の `claude_args` に `--allowedTools` を設定する。現在の設定:

```yaml
claude_args: '--allowedTools "Bash(npm *)"'
```

### 対象コマンド

- `npm install`: 依存パッケージのインストール
- `npm run build`: TypeScriptコンパイル + Viteビルド
- `npm run lint`: ESLint実行
- `npm run test`: ユニットテスト実行（設定されている場合）

権限が設定されていない場合、Claude は上記コマンドの実行をスキップし、PR作成時に手動確認を促すメッセージを表示します。

## アーキテクチャ上の注意点

### データモデル

- `TreeNode` はフラットリスト + `parentId` 方式
- ネスト構造は描画時に `useMemo` で計算して導出する
- ルートノードは `parentId === null`、兄弟間の順序は `order` で管理

### 状態管理

- 全ツリー操作は Zustand ストアに集約
- ツリー操作の純粋関数は別ファイルに分離
- 両パネルが同一ストアを参照するため、片方の変更が自動的に反映される

### dagre の利用

- `@dagrejs/dagre` (v1) は Vite の ESM 環境で dynamic require エラーが出るため、`dagre` (v0.8) を使用
- 複数ルートは個別に dagre レイアウトして Y オフセットで縦積み

### ツリー D&D

- `onNodeDragStop` で最近接ノードを検出（120px 閾値）
- 循環参照チェック: `getDescendantIds` で子孫を取得し、移動先が子孫でないことを確認
