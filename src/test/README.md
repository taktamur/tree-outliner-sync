# テスト

このプロジェクトではVitestを使用してユニットテストを実行します。

## テストの実行

```bash
# テストを実行（ウォッチモード）
npm test

# テストを1回実行
npm run test:run

# テストUIを開く
npm run test:ui
```

## テストファイルの配置

テストファイルは対象ファイルと同じディレクトリに `*.test.ts` または `*.test.tsx` という名前で配置します。

例:
- `src/utils/treeOperations.ts` → `src/utils/treeOperations.test.ts`
- `src/utils/layoutCalculator.ts` → `src/utils/layoutCalculator.test.ts`

## カバレッジ

現在のテスト対象:
- ✅ `src/utils/treeOperations.ts` - ツリー操作の純粋関数
- ✅ `src/utils/layoutCalculator.ts` - dagreレイアウト計算

## 注意事項

- テストは依存関係のインストール後に実行してください: `npm install`
- Vitestは `vitest.config.ts` で設定されています
- グローバルなテスト関数（describe, it, expect）は自動的にインポートされます
