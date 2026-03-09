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
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ClustersPage from "../../../../../Frontend/src/app/clusters/page";
import { getAllClusters, getClustersStatusByIds } from "../../../../../Frontend/src/services/cluster-service";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../../../Frontend/src/redux/hook";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock(
  "react-redux",
  () => ({
    useDispatch: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock("../../../../../Frontend/src/redux/hook", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../../../../../Frontend/src/services/cluster-service", () => ({
  getAllClusters: jest.fn(),
  getClustersStatusByIds: jest.fn(),
}));

jest.mock("../../../../../Frontend/src/hooks/useAccessToken", () => ({
  __esModule: true,
  default: () => ({
    getSrvAccessToken: () => "token",
    refreshAccessToken: jest.fn(),
    isTokenExpired: jest.fn(),
  }),
}));

jest.mock("../../../../../Frontend/src/hooks/useActivity", () => ({
  useActivity: () => ({
    reportErrorFromException: jest.fn(),
  }),
}));

jest.mock("../../../../../Frontend/src/layouts/page-wrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../../../../Frontend/src/components/common/ActivityPanel", () => ({
  __esModule: true,
  default: () => <div>Activity Panel</div>,
}));

jest.mock("../../../../../Frontend/src/components/cluster-details/cluster-registration-form", () => ({
  __esModule: true,
  default: () => <div>Cluster Registration Form</div>,
}));

jest.mock(
  "antd",
  () => {
    const Form = {
      useForm: () => [
        {
          resetFields: jest.fn(),
        },
      ],
    };

    const Typography = ({ children }: any) => <div>{children}</div>;
    Typography.Title = ({ children }: any) => <h2>{children}</h2>;
    Typography.Text = ({ children }: any) => <span>{children}</span>;

    const Layout = ({ children }: any) => <div>{children}</div>;
    Layout.Content = ({ children }: any) => <div>{children}</div>;

    const Input = ({ children }: any) => <div>{children}</div>;
    Input.Search = ({ placeholder, onSearch }: any) => (
      <input
        aria-label="cluster-search"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
      />
    );

    return {
      Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
      Divider: ({ children }: any) => <div>{children}</div>,
      Layout,
      message: { error: jest.fn() },
      Modal: ({ title, open, children }: any) =>
        open ? (
          <div>
            <div>{title}</div>
            {children}
          </div>
        ) : null,
      theme: {
        useToken: () => ({
          token: { colorBgContainer: "#fff", borderRadiusLG: 8 },
        }),
      },
      Typography,
      Form,
      Input,
      Card: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
      Col: ({ children }: any) => <div>{children}</div>,
      Row: ({ children }: any) => <div>{children}</div>,
    };
  },
  { virtual: true }
);

describe("Clusters Page", () => {
  const mockedUseRouter = useRouter as jest.Mock;
  const mockedUseAppSelector = useAppSelector as jest.Mock;
  const mockedGetAllClusters = getAllClusters as jest.MockedFunction<typeof getAllClusters>;
  const mockedGetClustersStatusByIds =
    getClustersStatusByIds as jest.MockedFunction<typeof getClustersStatusByIds>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseRouter.mockReturnValue({ push: jest.fn() });
    mockedUseAppSelector.mockImplementation((selector: any) =>
      selector({
        authData: { userData: { email: "admin@test.com", role: "admin" } },
        clusterData: { selectedCluster: null },
      })
    );

    mockedGetAllClusters.mockResolvedValue({ data: [] } as any);
    mockedGetClustersStatusByIds.mockResolvedValue({ clusters: [] } as any);
  });

  it("renders key header actions", async () => {
    render(<ClustersPage />);

    expect(screen.getByText("My Clusters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("search...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add New Cluster" })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetAllClusters).toHaveBeenCalled();
    });
  });

  it("opens add cluster modal when clicking add button", async () => {
    render(<ClustersPage />);

    expect(screen.queryByText("Cluster Registration Form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add New Cluster" }));

    await waitFor(() => {
      expect(screen.getByText("Cluster Registration Form")).toBeInTheDocument();
    });
  });
});
