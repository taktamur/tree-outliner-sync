/**
 * CustomNode スナップショットテスト
 *
 * CustomNodeは純粋なプレゼンテーションコンポーネント（シンプルなprops構造）のため、
 * スナップショットテストでビジュアルの一貫性を保証する。
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import CustomNode from './CustomNode';
import type { NodeProps } from '@xyflow/react';

describe('CustomNode', () => {
  it('should match snapshot when not selected', () => {
    const props: NodeProps = {
      id: 'test-node',
      data: { label: 'Test Node', selected: false },
      // NodePropsの最小限の必須フィールド
      type: 'custom',
      selected: false,
      isConnectable: true,
      xPos: 0,
      yPos: 0,
      dragging: false,
      zIndex: 0,
      selectable: true,
      deletable: true,
      draggable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as NodeProps;

    const { container } = render(
      <ReactFlowProvider>
        <CustomNode {...props} />
      </ReactFlowProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot when selected', () => {
    const props: NodeProps = {
      id: 'test-node',
      data: { label: 'Selected Node', selected: true },
      type: 'custom',
      selected: true,
      isConnectable: true,
      xPos: 0,
      yPos: 0,
      dragging: false,
      zIndex: 0,
      selectable: true,
      deletable: true,
      draggable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as NodeProps;

    const { container } = render(
      <ReactFlowProvider>
        <CustomNode {...props} />
      </ReactFlowProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot when dragging', () => {
    const props: NodeProps = {
      id: 'test-node',
      data: { label: 'Dragging Node', selected: false },
      type: 'custom',
      selected: false,
      isConnectable: true,
      xPos: 0,
      yPos: 0,
      dragging: true,
      zIndex: 0,
      selectable: true,
      deletable: true,
      draggable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    } as NodeProps;

    const { container } = render(
      <ReactFlowProvider>
        <CustomNode {...props} />
      </ReactFlowProvider>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
