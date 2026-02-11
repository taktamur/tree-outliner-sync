# クリーンアップメカニズムの説明

このリポジトリでは、マージ済みのPRブランチとCloudflare Pagesのデプロイメントを自動的にクリーンアップする仕組みを提供しています。

## セットアップ手順

ワークフローテンプレートは `docs/workflows/` ディレクトリに用意されています。有効化するには、これらのファイルを `.github/workflows/` にコピーしてください：

```bash
# マージ済みブランチの自動削除（推奨）
cp docs/workflows/cleanup-merged-branches.yml .github/workflows/

# 古いclaudeブランチの定期削除（推奨）
cp docs/workflows/cleanup-stale-branches.yml .github/workflows/

# Cloudflareデプロイメント削除（オプション、要設定）
# ※ 使用前に下記の「Cloudflare Pagesデプロイメントの削除」セクションを参照
cp docs/workflows/cleanup-cloudflare-deployments.yml.example .github/workflows/cleanup-cloudflare-deployments.yml
```

コピー後、変更をコミット・プッシュすることでワークフローが有効化されます。

## 提供されているワークフロー

### 1. マージ済みブランチの自動削除 (`cleanup-merged-branches.yml`)

**トリガー:** PRがマージされた時

**動作:**
- PRがマージされると、そのブランチを自動的に削除します
- GitHub APIを使用してブランチを削除

**利点:**
- マージ直後にブランチがクリーンアップされる
- 手動でのブランチ削除作業が不要

### 2. 古いclaudeブランチの定期削除 (`cleanup-stale-branches.yml`)

**トリガー:**
- 毎日午前3時（UTC）に自動実行
- 手動実行も可能（Actions タブから）

**動作:**
- `main`ブランチにマージ済みの`claude/`プレフィックスのブランチを検出
- 検出されたブランチをすべて削除

**利点:**
- 削除漏れのブランチも定期的にクリーンアップ
- Claudeが作成したブランチのみを対象とするため安全

### 3. Cloudflare Pagesデプロイメントの削除（オプション）

**テンプレートファイル:** `docs/workflows/cleanup-cloudflare-deployments.yml.example`

このワークフローを使用するには、以下の手順が必要です:

#### セットアップ手順

1. **Cloudflare API Tokenの作成**
   - [Cloudflareダッシュボード](https://dash.cloudflare.com/)にログイン
   - "My Profile" → "API Tokens" → "Create Token"
   - "Edit Cloudflare Workers" テンプレートを選択（またはカスタムトークンで`Pages`の編集権限を付与）
   - Account Resources: 対象のアカウントを選択
   - Zone Resources: All zones または特定のゾーン

2. **GitHub Secretsの設定**
   - リポジトリの Settings → Secrets and variables → Actions
   - 以下のシークレットを追加:
     - `CLOUDFLARE_API_TOKEN`: 上記で作成したAPIトークン
     - `CLOUDFLARE_ACCOUNT_ID`: CloudflareのAccount ID（ダッシュボードのURLまたは右サイドバーで確認可能）

3. **ワークフローの有効化**
   ```bash
   cp docs/workflows/cleanup-cloudflare-deployments.yml.example \
      .github/workflows/cleanup-cloudflare-deployments.yml
   ```

   コピー後、変更をコミット・プッシュします。

4. **プロジェクト名の確認**
   - ワークフロー内の`PROJECT_NAME`がCloudflare Pagesのプロジェクト名と一致していることを確認
   - デフォルトは`tree-outliner-sync`

#### 動作

**トリガー:**
- PRがクローズされた時
- 毎週日曜日午前4時（UTC）
- 手動実行

**処理内容:**
1. Cloudflare Pages の全デプロイメントを取得
2. 各デプロイメントに紐づくブランチを確認
3. GitHubに存在しないブランチのデプロイメントを削除

## Cloudflare Pagesの自動削除について

**重要:** Cloudflare Pagesは、ブランチが削除されても**デプロイメントを自動削除しません**。これは仕様です。

理由:
- デプロイメント履歴として保持される
- ロールバックや参照のため

そのため、不要なデプロイメントを削除するには:
1. 上記のワークフローを有効化する（推奨）
2. Cloudflareダッシュボードから手動で削除
3. Cloudflare APIを直接使用

## トラブルシューティング

### ブランチ削除が失敗する場合

- GitHub Actionsの権限を確認（デフォルトの`GITHUB_TOKEN`で動作するはず）
- ブランチが保護されていないか確認

### Cloudflareデプロイメント削除が失敗する場合

- API Tokenの権限を確認（Pages編集権限が必要）
- Account IDが正しいか確認
- プロジェクト名が正しいか確認

### 手動でブランチを削除したい場合

```bash
# ローカルで確認
git branch -r --merged origin/main | grep 'origin/claude/'

# 手動削除（例）
git push origin --delete claude/issue-XX-YYYYMMDD-HHMM
```

## 参考

- [GitHub Actions ワークフロー構文](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [Cloudflare Pages API](https://developers.cloudflare.com/api/operations/pages-deployment-get-deployments)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
