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

import React from "react";
import { render, screen, act } from "@testing-library/react";

// mock* prefix allows these to be referenced inside jest.mock() factories (hoisting rule)
let mockHighLevelProps: any = {};
let mockLowLevelProps: any = {};

jest.mock(
  "../../../../../Frontend/src/components/visualization/high-level-graph-visualization",
  () => {
    const R = require("react");
    return {
      __esModule: true,
      default: (props: any) => {
        mockHighLevelProps = props;
        return R.createElement("div", { "data-testid": "mock-high-level" });
      },
    };
  }
);

jest.mock(
  "../../../../../Frontend/src/components/visualization/low-level-graph-visualization",
  () => {
    const R = require("react");
    return {
      __esModule: true,
      default: (props: any) => {
        mockLowLevelProps = props;
        return R.createElement("div", { "data-testid": "mock-low-level" });
      },
    };
  }
);

jest.mock(
  "vis-network/standalone",
  () => ({
    Network: jest.fn().mockImplementation(() => ({ destroy: jest.fn() })),
    DataSet: jest.fn().mockImplementation(() => ({ add: jest.fn() })),
  }),
  { virtual: true }
);

jest.mock(
  "antd",
  () => ({
    Spin: () => null,
    Progress: () => null,
    Button: () => null,
    Card: () => null,
    message: { error: jest.fn(), success: jest.fn() },
    Descriptions: () => null,
  }),
  { virtual: true }
);

jest.mock(
  "@ant-design/icons",
  () => ({ LoadingOutlined: () => null }),
  { virtual: true }
);

jest.mock("@/services/graph-visualiztion", () => ({
  getGraphVizualization: jest.fn(),
}));

jest.mock("@/utils/time", () => ({
  delay: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/redux/hook", () => ({
  useAppSelector: jest.fn().mockReturnValue({}),
}));

import TwoLevelGraphVisualization from "../../../../../Frontend/src/components/visualization/two-level-graph-visualization";

describe("TwoLevelGraphVisualization", () => {
  const defaultProps = {
    graphID: "graph-1",
    graph: {
      id: 1,
      name: "Test Graph",
      partitionCount: 2,
      nodeCount: 10,
      edgeCount: 5,
      partitions: [],
    } as any,
    onPartitionClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHighLevelProps = {};
    mockLowLevelProps = {};
  });

  it("renders HighLevelGraphVisualization by default", () => {
    render(<TwoLevelGraphVisualization {...defaultProps} />);
    expect(screen.getByTestId("mock-high-level")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-low-level")).not.toBeInTheDocument();
  });

  it("passes graphID and onPartitionClick to HighLevelGraphVisualization", () => {
    render(<TwoLevelGraphVisualization {...defaultProps} />);
    expect(mockHighLevelProps.graphID).toBe("graph-1");
    expect(mockHighLevelProps.onPartitionClick).toBe(defaultProps.onPartitionClick);
    expect(typeof mockHighLevelProps.onLowLevelViewClick).toBe("function");
  });

  it("switches to LowLevelGraphVisualization when onLowLevelViewClick is called", async () => {
    render(<TwoLevelGraphVisualization {...defaultProps} />);
    expect(screen.getByTestId("mock-high-level")).toBeInTheDocument();
    await act(async () => {
      await mockHighLevelProps.onLowLevelViewClick();
    });
    expect(screen.queryByTestId("mock-high-level")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-low-level")).toBeInTheDocument();
  });

  it("switches back to HighLevelGraphVisualization when onHighLevelViewClick is called", async () => {
    render(<TwoLevelGraphVisualization {...defaultProps} />);
    await act(async () => {
      await mockHighLevelProps.onLowLevelViewClick();
    });
    expect(screen.getByTestId("mock-low-level")).toBeInTheDocument();
    await act(async () => {
      await mockLowLevelProps.onHighLevelViewClick();
    });
    expect(screen.getByTestId("mock-high-level")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-low-level")).not.toBeInTheDocument();
  });
});
