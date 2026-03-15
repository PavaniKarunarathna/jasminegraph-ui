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
import { render, screen, waitFor } from '@testing-library/react';
import GraphVisualization from '../../../../../Frontend/src/components/visualization/graph-visualization';
import { getGraphVizualization } from '../../../../../Frontend/src/services/graph-visualiztion';
import { delay } from '../../../../../Frontend/src/utils/time';
import { Network } from 'vis-network/standalone';
import mockGraphData from '../../../fixtures/mock-graph-data.json';

jest.mock('../../../../../Frontend/src/services/graph-visualiztion', () => ({
  getGraphVizualization: jest.fn(),
}));

jest.mock('../../../../../Frontend/src/utils/time', () => ({
  delay: jest.fn(() => Promise.resolve()),
}));

const mockDataSetInstances: Array<{ add: jest.Mock }> = [];
const mockNetworkDestroy = jest.fn();

jest.mock('vis-network/standalone', () => ({
  DataSet: jest.fn(() => {
    const instance = { add: jest.fn() };
    mockDataSetInstances.push(instance);
    return instance;
  }),
  Network: jest.fn((container: any, data: any, options: any) => ({
    destroy: mockNetworkDestroy,
  })),
}), { virtual: true });

jest.mock('antd', () => ({
  Spin: ({ spinning }: any) => <div data-testid="spin">{spinning ? 'loading' : 'idle'}</div>,
  Progress: ({ percent }: any) => <div data-testid="progress">{percent}</div>,
  Button: ({ children }: any) => <button>{children}</button>,
}), { virtual: true });

jest.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => <span data-testid="loading-icon" />,
}), { virtual: true });

describe('GraphVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataSetInstances.length = 0;
  });

  it('renders graph container and initializes network', async () => {
    (getGraphVizualization as jest.Mock).mockResolvedValue({ data: { nodes: [], edges: [] } });

    const { container } = render(<GraphVisualization graphID="graph-1" />);

    const graphContainer = container.querySelector('div[style*="height: 600px"]');
    expect(graphContainer).toBeInTheDocument();

    await waitFor(() => {
      expect(Network).toHaveBeenCalled();
    });
  });

  it('fetches data using graphID and adds nodes/edges from fixture mock file', async () => {
    (getGraphVizualization as jest.Mock).mockResolvedValue({ data: mockGraphData });

    render(<GraphVisualization graphID="fixture-graph-id" />);

    await waitFor(() => {
      expect(getGraphVizualization).toHaveBeenCalledWith('fixture-graph-id');
    });

    await waitFor(() => {
      const hasDataAdds = mockDataSetInstances.some((set) => set.add.mock.calls.length > 0);
      expect(hasDataAdds).toBe(true);
    });

    expect(delay).toHaveBeenCalled();
  });

  it('shows progress after graph fetch starts', async () => {
    (getGraphVizualization as jest.Mock).mockResolvedValue({ data: mockGraphData });

    render(<GraphVisualization graphID="graph-with-progress" />);

    expect(await screen.findByTestId('progress')).toBeInTheDocument();
  });

  it('destroys network on unmount', async () => {
    (getGraphVizualization as jest.Mock).mockResolvedValue({ data: { nodes: [], edges: [] } });

    const { unmount } = render(<GraphVisualization graphID="graph-cleanup" />);

    await waitFor(() => {
      expect(Network).toHaveBeenCalled();
    });

    unmount();

    expect(mockNetworkDestroy).toHaveBeenCalled();
  });
});
