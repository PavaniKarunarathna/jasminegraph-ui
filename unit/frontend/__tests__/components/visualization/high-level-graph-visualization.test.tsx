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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TwoLevelGraphVisualization from '../../../../../Frontend/src/components/visualization/high-level-graph-visualization';
import { Network } from 'vis-network/standalone';

jest.mock('vis-network/standalone', () => ({
  DataSet: jest.fn(() => ({
    add: jest.fn(),
    clear: jest.fn(),
  })),
  Network: jest.fn(() => ({
    destroy: jest.fn(),
    setData: jest.fn(),
    fit: jest.fn(),
    on: jest.fn(),
  })),
}), { virtual: true });

jest.mock('antd', () => ({
  Alert: ({ message }: any) => <div>{message}</div>,
  Spin: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  Descriptions: ({ title, items }: any) => (
    <div>
      <div>{title}</div>
      {items?.map((item: any) => (
        <div key={item.key}>{`${item.label}: ${item.children}`}</div>
      ))}
    </div>
  ),
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  message: {
    warning: jest.fn(),
  },
}), { virtual: true });

jest.mock('@ant-design/icons', () => ({
  LoadingOutlined: () => <span data-testid="loading-icon" />,
}), { virtual: true });

describe('TwoLevelGraphVisualization', () => {
  const graph = {
    idgraph: 1,
    name: 'Test Graph',
    centralpartitioncount: 2,
    vertexcount: 30,
    edgecount: 50,
    upload_path: '/tmp/test',
    status: 'READY',
    partitions: [
      {
        idpartition: 1,
        vertexcount: 10,
        edgecount: 20,
        central_vertexcount: 3,
        central_edgecount: 5,
        central_edgecount_with_dups: 6,
      },
      {
        idpartition: 2,
        vertexcount: 20,
        edgecount: 30,
        central_vertexcount: 4,
        central_edgecount: 7,
        central_edgecount_with_dups: 8,
      },
    ],
  };

  const mockOnPartitionClick = jest.fn().mockResolvedValue(undefined);
  const mockOnLowLevelViewClick = jest.fn();
  const mockSetSelectedNode = jest.fn();
  const mockSetTotalNoOfEdges = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders visualization and initializes network', async () => {
    const { container } = render(
      <TwoLevelGraphVisualization
        graphID={1}
        graph={graph as any}
        onPartitionClick={mockOnPartitionClick}
        onLowLevelViewClick={mockOnLowLevelViewClick}
        selectedNode={null}
        setSelectedNode={mockSetSelectedNode}
        setTotalNoOfEdges={mockSetTotalNoOfEdges}
      />
    );

    const graphContainer = container.querySelector('div[style*="height: 600px"]');
    expect(graphContainer).toBeInTheDocument();

    await waitFor(() => {
      expect(Network).toHaveBeenCalled();
    });
  });

  it('wires select and deselect handlers to setSelectedNode', async () => {
    render(
      <TwoLevelGraphVisualization
        graphID={1}
        graph={graph as any}
        onPartitionClick={mockOnPartitionClick}
        onLowLevelViewClick={mockOnLowLevelViewClick}
        selectedNode={null}
        setSelectedNode={mockSetSelectedNode}
      />
    );

    await waitFor(() => {
      expect(Network).toHaveBeenCalled();
    });

    const networkInstance = (Network as jest.Mock).mock.results[0].value;
    const selectCall = networkInstance.on.mock.calls.find((call: any[]) => call[0] === 'selectNode');
    const deselectCall = networkInstance.on.mock.calls.find((call: any[]) => call[0] === 'deselectNode');

    selectCall[1]({ nodes: [1] });
    deselectCall[1]({ nodes: [] });

    expect(mockSetSelectedNode).toHaveBeenCalledWith([1]);
    expect(mockSetSelectedNode).toHaveBeenCalledWith([]);
  });

  it('shows selected partition details and handles View Graph click', async () => {
    render(
      <TwoLevelGraphVisualization
        graphID={1}
        graph={graph as any}
        onPartitionClick={mockOnPartitionClick}
        onLowLevelViewClick={mockOnLowLevelViewClick}
        selectedNode={[1]}
        setSelectedNode={mockSetSelectedNode}
        setTotalNoOfEdges={mockSetTotalNoOfEdges}
      />
    );

    expect(screen.getByText(/partition 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view graph/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view graph/i }));

    await waitFor(() => {
      expect(mockSetTotalNoOfEdges).toHaveBeenCalledWith(20);
      expect(mockOnPartitionClick).toHaveBeenCalledWith(1);
      expect(mockOnLowLevelViewClick).toHaveBeenCalled();
    });
  });

  it('shows warning when selected node details are missing', async () => {
    render(
      <TwoLevelGraphVisualization
        graphID={1}
        graph={graph as any}
        onPartitionClick={mockOnPartitionClick}
        onLowLevelViewClick={mockOnLowLevelViewClick}
        selectedNode={[999]}
        setSelectedNode={mockSetSelectedNode}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /view graph/i }));

    await waitFor(() => {
      const { message } = require('antd');
      expect(message.warning).toHaveBeenCalledWith('No node details found for the selected node.');
    });

    expect(mockOnPartitionClick).not.toHaveBeenCalled();
    expect(mockOnLowLevelViewClick).not.toHaveBeenCalled();
  });
});
