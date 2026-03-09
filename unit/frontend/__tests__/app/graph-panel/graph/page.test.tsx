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
import GraphDetails from "../../../../../../Frontend/src/app/graph-panel/graph/page";
import { getGraphList } from "../../../../../../Frontend/src/services/graph-service";

jest.mock("../../../../../../Frontend/src/services/graph-service", () => ({
  getGraphList: jest.fn(),
  deleteGraph: jest.fn(),
}));

jest.mock("../../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock(
  "antd",
  () => ({
    Table: ({ columns, loading }: any) => (
      <div>
        {loading && <div>Loading...</div>}
        <table>
          <thead>
            <tr>
              {columns?.map((col: any) => (
                <th key={col.key}>{col.title}</th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
    ),
    Tag: ({ children }: any) => <span>{children}</span>,
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Popconfirm: ({ children, onConfirm }: any) => <div onClick={onConfirm}>{children}</div>,
    message: { success: jest.fn(), error: jest.fn() },
    Space: ({ children }: any) => <div>{children}</div>,
    Spin: ({ children }: any) => <div>{children}</div>,
  }),
  { virtual: true }
);

describe("Graph Details Page", () => {
  const mockedGetGraphList = getGraphList as jest.MockedFunction<typeof getGraphList>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetGraphList.mockResolvedValue({
      data: [
        { id: 1, idgraph: "g1", name: "Graph 1", type: "directed", vertexCount: 100, edgeCount: 200, status: "op" },
      ],
    } as any);
  });

  it("fetches graph list on mount", async () => {
    render(<GraphDetails />);

    await waitFor(() => {
      expect(mockedGetGraphList).toHaveBeenCalled();
    });
  });

  it("displays table with graph columns", () => {
    render(<GraphDetails />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Graph Type")).toBeInTheDocument();
    expect(screen.getByText("Vertex Count")).toBeInTheDocument();
    expect(screen.getByText("Edge Count")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
