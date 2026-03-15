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
import LowLevelGraphVisualization from '../../../../../Frontend/src/components/visualization/low-level-graph-visualization';

const mockUseAppSelector = jest.fn();
const mockSigmaDestroy = jest.fn();

jest.mock('../../../../../Frontend/src/redux/hook', () => ({
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
}));

jest.mock('randomcolor', () => jest.fn(() => '#abcdef'), { virtual: true });

jest.mock('graphology', () => {
  return jest.fn().mockImplementation(() => ({
    hasNode: jest.fn(() => false),
    addNode: jest.fn(),
    hasEdge: jest.fn(() => false),
    addEdge: jest.fn(),
    degree: jest.fn(() => 1),
    neighbors: jest.fn(() => []),
    forEachNode: jest.fn(),
    forEachEdge: jest.fn(),
    setNodeAttribute: jest.fn(),
    setEdgeAttribute: jest.fn(),
    getNodeAttributes: jest.fn(() => ({})),
    getEdgeAttributes: jest.fn(() => ({})),
  }));
}, { virtual: true });

jest.mock('sigma', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    getCamera: jest.fn(() => ({ animate: jest.fn() })),
    getNodeDisplayData: jest.fn(() => ({ x: 0, y: 0 })),
    destroy: mockSigmaDestroy,
  }));
}, { virtual: true });

jest.mock('graphology-layout-forceatlas2', () => ({
  __esModule: true,
  default: {
    assign: jest.fn(),
  },
}), { virtual: true });

jest.mock('antd', () => ({
  Button: ({ onClick, children }: any) => <button onClick={onClick}>{children || 'Back'}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  Progress: ({ percent }: any) => <div>{percent}</div>,
  Spin: ({ children, tip }: any) => <div>{tip}{children}</div>,
  Descriptions: ({ title, items }: any) => (
    <div>
      <div>{title}</div>
      {items?.map((item: any) => (
        <div key={item.key}>{`${item.label}:${item.children}`}</div>
      ))}
    </div>
  ),
}), { virtual: true });

jest.mock('@ant-design/icons', () => ({
  LeftOutlined: () => <span>left</span>,
}), { virtual: true });

describe('LowLevelGraphVisualization', () => {
  const mockOnHighLevelViewClick = jest.fn();

  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      queryData: {
        visualizeData: {
          node: [
            { id: 1, name: 'Node 1', label: 'Entity', partitionID: 1 },
            { id: 2, name: 'Node 2', label: 'Entity', partitionID: 1 },
          ],
          edge: [
            { from: 1, to: 2, type: 'REL', label: 'test' },
          ],
          render: false,
          updateProgress: 1,
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector: any) => selector(mockState));
  });

  it('renders search input and loading progress', async () => {
    render(
      <LowLevelGraphVisualization
        onHighLevelViewClick={mockOnHighLevelViewClick}
        totalNoOfEdges={2}
      />
    );

    expect(screen.getByPlaceholderText(/search node by id or label/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });
  });

  it('calls onHighLevelViewClick when back button is clicked', () => {
    render(
      <LowLevelGraphVisualization
        onHighLevelViewClick={mockOnHighLevelViewClick}
        totalNoOfEdges={2}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(mockOnHighLevelViewClick).toHaveBeenCalledTimes(1);
  });

  it('initializes sigma and registers graph interaction handlers', async () => {
    render(
      <LowLevelGraphVisualization
        onHighLevelViewClick={mockOnHighLevelViewClick}
        totalNoOfEdges={2}
      />
    );

    await waitFor(() => {
      const Sigma = require('sigma');
      expect(Sigma).toHaveBeenCalled();
    });

    const Sigma = require('sigma');
    const sigmaInstance = Sigma.mock.results[0].value;

    expect(sigmaInstance.on).toHaveBeenCalledWith('enterNode', expect.any(Function));
    expect(sigmaInstance.on).toHaveBeenCalledWith('leaveNode', expect.any(Function));
    expect(sigmaInstance.on).toHaveBeenCalledWith('enterEdge', expect.any(Function));
    expect(sigmaInstance.on).toHaveBeenCalledWith('leaveEdge', expect.any(Function));
  });
});
