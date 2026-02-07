# テストガイド

このプロジェクトでは [Vitest](https://vitest.dev/) を使用してユニットテストを実施しています。

## テストの実行

### すべてのテストを実行（ウォッチモード）
```bash
npm test
```

### すべてのテストを1回実行
```bash
npm run test:run
```

### テストUIを起動
```bash
npm run test:ui
```

## テストの構成

### ユーティリティ関数
- **`src/utils/idGenerator.test.ts`**: UUID生成のテスト
  - UUID形式の検証
  - 重複チェック

### 状態管理
- **`src/store/treeStore.test.ts`**: Zustandストアのテスト
  - ノードの追加・削除・更新
  - インデント・アウトデント操作
  - ノードの移動
  - 選択状態の管理

### カスタムフック
- **`src/hooks/useTreeLayout.test.tsx`**: ツリーレイアウト計算のテスト
  - React Flow形式への変換
  - 複数ルートノードの対応
  - エッジ生成
  - 選択状態の反映

- **`src/hooks/useKeyboardShortcuts.test.tsx`**: キーボードショートカットのテスト
  - Tab/Shift+Tab（インデント・アウトデント）
  - Enter（新規ノード追加）
  - Backspace（空ノード削除）
  - ArrowUp/Down（ノード間移動）

## テスト環境

- **テストランナー**: Vitest
- **DOM環境**: happy-dom
- **Reactテスト**: @testing-library/react
- **型定義**: TypeScript strict mode

## テストの書き方

各テストファイルは対応するソースファイルと同じディレクトリに配置し、`.test.ts` または `.test.tsx` の拡張子を使用します。

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('機能名', () => {
  beforeEach(() => {
    // 各テストの前に実行される初期化処理
  });

  it('期待される動作の説明', () => {
    // テストコード
    expect(actual).toBe(expected);
  });
});
```

## CI/CD

テストは継続的インテグレーションの一部として自動実行されます。すべてのプルリクエストはテストが成功することが要求されます。
