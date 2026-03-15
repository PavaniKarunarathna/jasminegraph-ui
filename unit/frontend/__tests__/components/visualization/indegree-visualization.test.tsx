/**
Copyright 2026 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import InDegreeVisualization from '../../../../../Frontend/src/components/visualization/indegree-visualization';

const mockUseAppSelector = jest.fn();

jest.mock('../../../../../Frontend/src/redux/hook', () => ({
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
}));

jest.mock('@mui/x-charts/ScatterChart', () => ({
  ScatterChart: ({ series, width, height }: any) => (
    <div data-testid="scatter-chart" data-width={String(width)} data-height={String(height)}>
      {JSON.stringify(series)}
    </div>
  ),
}), { virtual: true });

jest.mock('antd', () => ({
  Spin: ({ spinning }: any) => <div data-testid="spin">{spinning ? 'loading' : 'idle'}</div>,
  Progress: ({ percent }: any) => <div data-testid="progress">{percent}</div>,
}), { virtual: true });

jest.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => <span data-testid="loading-icon" />,
}), { virtual: true });

describe('InDegreeVisualization', () => {
  const mockQueryData = {
    inDegreeDataPool: [
      { node: '1', value: '5' },
      { node: '2', value: '3' },
    ],
    outDegreeDataPool: [
      { node: '10', value: '7' },
      { node: '11', value: '2' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseAppSelector.mockImplementation((selector: any) =>
      selector({ queryData: mockQueryData })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders spin and scatter chart', () => {
    render(<InDegreeVisualization loading={true} degree="in_degree" />);

    expect(screen.getByTestId('spin')).toHaveTextContent('loading');
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    expect(screen.getByTestId('scatter-chart')).toHaveAttribute('data-width', '1080');
    expect(screen.getByTestId('scatter-chart')).toHaveAttribute('data-height', '500');
  });

  it('uses in-degree data when degree is in_degree', () => {
    render(<InDegreeVisualization loading={false} degree="in_degree" />);

    const chart = screen.getByTestId('scatter-chart');
    expect(chart.textContent).toContain('"x":1');
    expect(chart.textContent).toContain('"y":5');
    expect(chart.textContent).toContain('"x":2');
    expect(chart.textContent).toContain('"y":3');
  });

  it('updates to out-degree data after degree prop changes', () => {
    const { rerender } = render(<InDegreeVisualization loading={false} degree="in_degree" />);

    rerender(<InDegreeVisualization loading={false} degree="out_degree" />);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const chart = screen.getByTestId('scatter-chart');
    expect(chart.textContent).toContain('"x":10');
    expect(chart.textContent).toContain('"y":7');
    expect(chart.textContent).toContain('"x":11');
    expect(chart.textContent).toContain('"y":2');
  });
});
