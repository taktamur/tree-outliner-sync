# ワークフローテンプレート

このディレクトリには、ブランチとCloudflareデプロイメントのクリーンアップを自動化するGitHub Actionsワークフローテンプレートが含まれています。

## 使い方

これらのワークフローを有効化するには、`.github/workflows/` ディレクトリにコピーしてください。

### 基本的なセットアップ（推奨）

```bash
# マージ済みブランチの自動削除
cp docs/workflows/cleanup-merged-branches.yml .github/workflows/

# 古いclaudeブランチの定期削除
cp docs/workflows/cleanup-stale-branches.yml .github/workflows/

# 変更をコミット
git add .github/workflows/
git commit -m "feat: ブランチ自動クリーンアップワークフローを追加"
git push
```

### Cloudflareデプロイメント削除（オプション）

Cloudflare Pagesのデプロイメントも自動削除したい場合:

1. **前提条件の確認**
   - Cloudflare API Tokenが必要
   - Cloudflare Account IDが必要
   - GitHub Secretsへの設定権限が必要

2. **セットアップ**
   ```bash
   # ワークフローをコピー（.exampleを削除）
   cp docs/workflows/cleanup-cloudflare-deployments.yml.example \
      .github/workflows/cleanup-cloudflare-deployments.yml
   ```

3. **GitHub Secretsの設定**
   - リポジトリ Settings → Secrets and variables → Actions
   - `CLOUDFLARE_API_TOKEN` を追加
   - `CLOUDFLARE_ACCOUNT_ID` を追加

4. **コミット・プッシュ**
   ```bash
   git add .github/workflows/cleanup-cloudflare-deployments.yml
   git commit -m "feat: Cloudflareデプロイメント自動削除を有効化"
   git push
   ```

## 各ワークフローの詳細

詳細な説明と動作仕様については、[../cleanup-mechanism.md](../cleanup-mechanism.md) を参照してください。

## ファイル一覧

- `cleanup-merged-branches.yml` - PRマージ時にブランチを自動削除
- `cleanup-stale-branches.yml` - マージ済みclaudeブランチを定期削除
- `cleanup-cloudflare-deployments.yml.example` - Cloudflareデプロイメント削除（要設定）

## 注意事項

- これらのワークフローは `.github/workflows/` にコピーするまで有効化されません
- `cleanup-cloudflare-deployments.yml.example` は必ずシークレット設定後に使用してください
- 一度コミット・プッシュすると、即座にワークフローが有効化されます
