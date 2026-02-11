/**
 * ShortcutBar スナップショットテスト
 *
 * ShortcutBarは純粋なプレゼンテーションコンポーネント（propsなし、状態なし）のため、
 * スナップショットテストでUIの一貫性を保証する。
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ShortcutBar from './ShortcutBar';

describe('ShortcutBar', () => {
  it('should match snapshot', () => {
    const { container } = render(<ShortcutBar />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
