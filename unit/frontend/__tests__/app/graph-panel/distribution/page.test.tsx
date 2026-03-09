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
import { render, screen, waitFor } from "@testing-library/react";
import GraphDistribution from "../../../../../../Frontend/src/app/graph-panel/distribution/page";
import { getGraphList } from "../../../../../../Frontend/src/services/graph-service";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}), { virtual: true });

jest.mock("../../../../../../Frontend/src/redux/hook", () => ({
  useAppDispatch: () => jest.fn(),
}));

jest.mock("../../../../../../Frontend/src/services/graph-service", () => ({
  getGraphList: jest.fn(),
}));

jest.mock("../../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock(
  "react-use-websocket",
  () => ({
    __esModule: true,
    default: () => ({
      sendJsonMessage: jest.fn(),
      lastJsonMessage: null,
      readyState: 1,
      getWebSocket: jest.fn(),
    }),
    ReadyState: {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3,
      UNINSTANTIATED: -1,
    },
  }),
  { virtual: true }
);

jest.mock("../../../../../../Frontend/src/components/visualization/graph-visualization", () => ({
  __esModule: true,
  default: () => <div>Graph Visualization</div>,
}));

jest.mock("../../../../../../Frontend/src/components/visualization/indegree-visualization", () => ({
  __esModule: true,
  default: () => <div>InDegree Visualization</div>,
}));

jest.mock("next/dynamic", () => () => {
  const DynamicComponent = () => <div>Two Level Graph Visualization</div>;
  return DynamicComponent;
});

jest.mock(
  "antd",
  () => ({
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    message: { error: jest.fn() },
    Select: ({ children, onChange, placeholder }: any) => (
      <select onChange={onChange} aria-label={placeholder}>
        {children}
      </select>
    ),
    Spin: ({ children }: any) => <div>{children}</div>,
  }),
  { virtual: true }
);

describe("Graph Distribution Page", () => {
  const mockedGetGraphList = getGraphList as jest.MockedFunction<typeof getGraphList>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetGraphList.mockResolvedValue({ data: [] } as any);
  });

  it("fetches graph list on mount", async () => {
    render(<GraphDistribution />);

    await waitFor(() => {
      expect(mockedGetGraphList).toHaveBeenCalled();
    });
  });

  it("renders graph visualization title", async () => {
    render(<GraphDistribution />);

    await waitFor(() => {
      expect(screen.getByText("Graph Visualization")).toBeInTheDocument();
    });
  });
});
