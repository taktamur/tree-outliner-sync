# Cloudflare Pages セットアップガイド

このガイドでは、PR単位のプレビュー環境を提供するCloudflare Pagesの設定方法を説明します。

## 概要

Cloudflare Pagesを使用すると、以下が自動的に実現されます：

- **本番環境**: mainブランチへのpush時に自動デプロイ
- **プレビュー環境**: PR作成・更新時に自動でプレビューURLを生成
- **高速なCDN**: Cloudflareのグローバルネットワークで配信
- **無料枠**: 個人プロジェクトには十分な無料枠

## セットアップ手順

### 1. Cloudflare Pagesプロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左サイドバーから「Workers & Pages」を選択
3. 「Create application」→「Pages」→「Connect to Git」をクリック
4. GitHubアカウントを連携（初回のみ）
5. リポジトリ `taktamur/tree-outliner-sync` を選択

### 2. ビルド設定

以下の設定を入力します：

| 項目 | 値 |
|------|-----|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (デフォルト) |

**環境変数**（必須ではありませんが、設定推奨）:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NODE_VERSION` | `20` | Node.jsバージョン（`.node-version`から自動検出されますが明示も可） |

### 3. デプロイ完了

「Save and Deploy」をクリックすると、初回ビルドが開始されます。

完了後、以下のURLが生成されます：

- **本番URL**: `https://tree-outliner-sync.pages.dev` (またはカスタムドメイン)
- **プレビューURL**: PR作成時に `https://<branch-name>.tree-outliner-sync.pages.dev` が自動生成されます

### 4. GitHub Pages との併用

現在のGitHub Pagesデプロイメント（`.github/workflows/deploy.yml`）は、そのまま維持できます。

**重要**: GitHub Pagesを継続利用する場合は、ワークフローファイルに環境変数を追加する必要があります：

```yaml
# .github/workflows/deploy.yml の build ジョブに追加
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # ... 既存のステップ ...
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_PATH: /tree-outliner-sync/  # この行を追加
      # ... 残りのステップ ...
```

**注意**: 上記の変更は手動で行う必要があります（セキュリティ上の理由でワークフローファイルは自動変更できません）。

## PR プレビューの確認方法

1. 新しいブランチでPRを作成
2. Cloudflare PagesがPRを検出し、自動的にビルドを開始
3. ビルド完了後、PRのコメント欄にCloudflare PagesボットがプレビューURLを投稿
4. URLをクリックしてプレビュー環境を確認

## カスタムドメインの設定（オプション）

本番環境にカスタムドメインを設定する場合：

1. Cloudflare Dashboard の Pages プロジェクト設定を開く
2. 「Custom domains」タブを選択
3. ドメインを追加し、DNS設定を行う

## トラブルシューティング

### ビルドが失敗する

- Cloudflare Dashboard の「Deployments」タブでログを確認
- Node.jsバージョンが正しいか確認（`.node-version`ファイルを参照）
- 依存関係がpackage.jsonに正しく記載されているか確認

### プレビューURLが表示されない

- Cloudflare PagesのGitHub連携が有効か確認
- PRのコメント欄でCloudflare Pagesボットの権限を確認

### GitHub Pages と Cloudflare Pages で表示が異なる

- `vite.config.ts` の `base` パス設定を確認
- GitHub Pages用のワークフローに `VITE_BASE_PATH` 環境変数が設定されているか確認

## 参考リンク

- [Cloudflare Pages 公式ドキュメント](https://developers.cloudflare.com/pages/)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html#cloudflare-pages)
- [GitHub連携ガイド](https://developers.cloudflare.com/pages/configuration/git-integration/)
