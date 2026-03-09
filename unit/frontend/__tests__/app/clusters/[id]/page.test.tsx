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
import ClusterDetails from "../../../../../../Frontend/src/app/clusters/[id]/page";
import { getCluster, getClusterProperties } from "../../../../../../Frontend/src/services/cluster-service";
import { useAppSelector } from "../../../../../../Frontend/src/redux/hook";

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
}), { virtual: true });

jest.mock("../../../../../../Frontend/src/redux/hook", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../../../../../../Frontend/src/services/cluster-service", () => ({
  getCluster: jest.fn(),
  getClusterProperties: jest.fn(),
}));

jest.mock("../../../../../../Frontend/src/hooks/useAccessToken", () => ({
  __esModule: true,
  default: () => ({
    getSrvAccessToken: () => "token",
  }),
}));

jest.mock("antd", () => {
  return {
    Descriptions: ({ title, items }: any) => (
      <div>
        <div>{title}</div>
        {items?.map((item: any) => (
          <div key={item.key}>
            <span>{item.label}:</span> <span>{item.children}</span>
          </div>
        ))}
      </div>
    ),
    Divider: ({ children }: any) => <div>{children}</div>,
    Table: ({ columns, dataSource }: any) => (
      <div>
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
    Row: ({ children }: any) => <div>{children}</div>,
    Col: ({ children }: any) => <div>{children}</div>,
  };
}, { virtual: true });

describe("Cluster Details Page", () => {
  const mockedUseAppSelector = useAppSelector as jest.Mock;
  const mockedGetCluster = getCluster as jest.MockedFunction<typeof getCluster>;
  const mockedGetClusterProperties = getClusterProperties as jest.MockedFunction<typeof getClusterProperties>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAppSelector.mockImplementation((selector: any) =>
      selector({
        clusterData: { selectedCluster: null },
      })
    );

    mockedGetCluster.mockResolvedValue({
      data: {
        id: "123",
        name: "Test Cluster",
        description: "Test cluster description",
        host: "localhost:8080",
      },
    } as any);

    mockedGetClusterProperties.mockResolvedValue({
      data: {
        version: "1.0.0",
        workersCount: 5,
        partitionCount: 10,
      },
    } as any);
  });

  it("renders cluster name and description", async () => {
    render(<ClusterDetails params={{ id: "123" }} />);

    await waitFor(() => {
      expect(screen.getByText("Test Cluster")).toBeInTheDocument();
      expect(screen.getByText(/Test cluster description/i)).toBeInTheDocument();
    });
  });

  it("displays cluster information section", async () => {
    render(<ClusterDetails params={{ id: "123" }} />);

    await waitFor(() => {
      expect(screen.getByText("Cluster Information")).toBeInTheDocument();
      expect(screen.getByText(/Cluster ID/i)).toBeInTheDocument();
      expect(screen.getByText(/JasmineGraph Version/i)).toBeInTheDocument();
    });
  });
});
