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
import { render, screen } from "@testing-library/react";
import { useAppSelector } from "@/redux/hook";
import QueryVisualization from "../../../../../Frontend/src/components/visualization/query-visualization";
import { Network, DataSet } from "vis-network/standalone";

jest.mock(
  "vis-network/standalone",
  () => {
    const mockNetworkDestroy = jest.fn();
    const MockNetwork = jest.fn().mockImplementation(() => ({
      destroy: mockNetworkDestroy,
      on: jest.fn(),
    }));
    const MockDataSet = jest.fn().mockImplementation(() => ({
      add: jest.fn(),
    }));
    return { Network: MockNetwork, DataSet: MockDataSet };
  },
  { virtual: true }
);

jest.mock("randomcolor", () => jest.fn(() => "#AABBCC"), { virtual: true });

jest.mock(
  "@ant-design/icons",
  () => ({ LoadingOutlined: () => <span /> }),
  { virtual: true }
);

jest.mock(
  "antd",
  () => ({
    Spin: ({ spinning }: any) => (
      <div data-testid="spin" data-spinning={String(spinning)} />
    ),
    Progress: ({ percent }: any) => (
      <div data-testid="progress">{String(percent)}</div>
    ),
  }),
  { virtual: true }
);

jest.mock("@/redux/hook", () => ({
  useAppSelector: jest.fn(),
}));


describe("QueryVisualization", () => {
  const mockUseAppSelector = useAppSelector as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppSelector.mockReturnValue({ messagePool: {} });
  });

  it("renders the spinner with initial loading state false", () => {
    render(<QueryVisualization />);
    const spinEl = screen.getByTestId("spin");
    expect(spinEl).toBeInTheDocument();
    expect(spinEl.getAttribute("data-spinning")).toBe("false");
  });

  it("initializes two DataSets and a Network on mount", () => {
    render(<QueryVisualization />);
    expect(DataSet).toHaveBeenCalledTimes(2);
    expect(Network).toHaveBeenCalledTimes(1);
  });

  it("adds nodes from messagePool to the nodes DataSet", () => {
    const mockMessagePool = {
      "thread-1": [
        JSON.stringify({
          pathNodes: [
            { id: "1", name: "Node A", label: "Person", partitionID: 0 },
            { id: "2", name: "Node B", label: "Person", partitionID: 1 },
          ],
          pathRels: [{ type: "KNOWS" }],
        }),
      ],
    };
    mockUseAppSelector.mockReturnValue({ messagePool: mockMessagePool });

    render(<QueryVisualization />);

    const nodesDataSet = (DataSet as jest.Mock).mock.results[0].value;
    const addedNodes: any[] = nodesDataSet.add.mock.calls[0][0];
    expect(addedNodes).toHaveLength(2);
    expect(addedNodes[0]).toMatchObject({ id: "1", label: "Node A" });
    expect(addedNodes[1]).toMatchObject({ id: "2", label: "Node B" });
  });

  it("destroys the vis-network instance on unmount", () => {
    const { unmount } = render(<QueryVisualization />);
    const networkInstance = (Network as jest.Mock).mock.results[0].value;
    unmount();
    expect(networkInstance.destroy).toHaveBeenCalledTimes(1);
  });
});
